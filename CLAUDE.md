# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevStretch Plus (deployed at https://devstretchplus.vercel.app) is a no-build, no-framework PWA — vanilla HTML/CSS/JS only. There are no npm packages, no bundler, no transpilation step, and no test suite. To "run" the app, serve it over HTTP (browsers block certain APIs like service workers and notifications on `file://`).

```bash
# Any static file server works. Examples:
npx serve .
python -m http.server 8080
# Then open http://localhost:8080
```

When making changes, hard-refresh the browser (`Ctrl+Shift+R`) to bypass the service worker cache. To fully reset the cache during development, unregister the service worker in DevTools → Application → Service Workers.

## Architecture

Scripts load in this order (all `defer`, so DOMContentLoaded fires after all are parsed):

0. **`version.js`** — declares one global: `APP_VERSION`, used by `script.js` to fill every `[data-app-version]` element in `index.html`. **`sw.js` has its own hardcoded copy of `APP_VERSION`** (not imported) so that its bytes change on every version bump — the browser's service worker update algorithm does a byte-diff on `sw.js`, so if `sw.js` never changes, users stay on the old cached version forever. The patch version is auto-bumped by `.githooks/pre-commit` in **both** `version.js` and `sw.js` on every commit to `master` (enable once per clone with `git config core.hooksPath .githooks`); the hook skips when `version.js` is already staged, which is how minor/major bumps are done manually.

1. **`exercises.json`** — pure data file (not a script) with two top-level arrays: `exercises` (plain objects, each with `number`, `name`, `subtitle`, `duration` (seconds), `section`, `emoji`, `description`) and `sets` (progressive groups, each with `number`, `name`, `exercises`). It is the single source of truth for workout content and structure. `script.js` fetches it on DOMContentLoaded, assigns the `EXERCISES`/`SETS` globals from it, and only then constructs `WorkoutTimer` — nothing may touch those globals before the fetch resolves. Exercise numbers are non-contiguous (gaps exist from past renumbering) — the runtime handles this via `.find()`, not array indexing.

2. **`notifications.js`** — defines two classes: `NotificationManager` (Web Notifications permission + `showNotification` via service worker with `new Notification()` fallback) and `ReminderTimer` (standalone countdown with states `idle → running → paused → fired`; fires callbacks for sound/speech/notification when it hits zero).

3. **`script.js`** — declares the `EXERCISES`/`SETS` globals (empty until `exercises.json` is fetched) and defines the `WorkoutTimer` class, instantiated as `window.workoutTimer` once the fetch resolves. Owns all timer state, set-based exercise playback (active → rest → next exercise → set complete), Web Speech API voice guidance, Web Audio for sound effects, and the Screen Wake Lock. Also holds a `ReminderTimer` instance; wires its `onTick`/`onComplete` callbacks, renders its countdown in the shared `#timerDisplay` when idle, and auto-starts the next set when the reminder fires. Starting a set calls `this.reminder.reset()` — the two timers are mutually exclusive.

4. **`pwa.js`** — registers `sw.js` as a service worker and handles the `beforeinstallprompt` event to show/hide the `#installBtn`.

**`sw.js`** runs in its own worker scope. It caches all static assets at install time (`CACHE_NAME` = `devstretch-plus-v${APP_VERSION}`) and serves them cache-first. **When adding new assets (sounds, icons, etc.), add them to the `ASSETS` array in `sw.js`** — the cache name follows `APP_VERSION`, so the pre-commit version bump busts the old cache automatically.

## Key Patterns

**ReminderTimer state machine** (`notifications.js`): `idle → running → paused → fired`. `start(minutes)` begins the countdown; `pause()`/`resume()` freeze/continue it; `reset()` returns to idle. When `currentSeconds` hits 0, state becomes `fired`, `onComplete()` is called (plays alarm + speaks + sends notification), and the timer stops — manual restart required. `WorkoutTimer` reads `this.reminder.state` in `updateDisplay()`'s idle branch to show the countdown in the main `MM:SS` block.

To test the reminder: serve the app, open `http://localhost:8080`, hard-refresh (`Ctrl+Shift+R`), then try the `▶ START` / `⏸ PAUSE` / `↺ RESET` buttons in the reminder row. To test the fired state quickly, open the browser console and run `window.workoutTimer.reminder.start(0.05)` (~3 seconds).

**Nag timer**: after the reminder fires while the workout is idle, `_startNagTimer()` schedules a `setTimeout` every 3 minutes to re-notify the user. `_clearNagTimer()` cancels it. The nag is cleared by `start()`, `reset()`, `_reminderReset()`, and `_reminderStart()` — any action that represents "I acknowledged this" must call `_clearNagTimer()`.

**Sets** (`exercises.json` + `script.js`): `currentSetIndex` tracks which set is queued; `activeSetIndex` snapshots it at `start()` and stays frozen for the life of the session. `_resolveSetExercises()` rebuilds `this.exercises` from `SETS[currentSetIndex].exercises` (mapped to full `EXERCISES` objects, filtered to drop any unmatched numbers). When `ReminderTimer.onComplete` fires, `currentSetIndex` advances — if a set is running, `tick()` detects the divergence (`currentSetIndex !== activeSetIndex`) at the next exercise boundary and calls `completeSet()` instead of continuing; if idle, the user must click START SET manually.

**Timer state machine** (`WorkoutTimer` in `script.js`): `isRunning` + `isResting` + `currentExerciseIndex` + `currentTime` fully define the session state. `_step()` decrements `currentTime` by one second and handles the transitions: active exercise → rest period → next exercise → set complete.

**Background-tab resilience**: browsers throttle background-tab `setInterval` to ~1/min (or suspend it), so neither timer trusts one callback per second. `WorkoutTimer.tick()` counts elapsed wall-clock seconds since `_lastTickTs` and runs `_step()` that many times, muting sound/voice via `_suppressCues` for all but the final second (set completion cues always play). `ReminderTimer` stores a `_deadline` timestamp and recomputes `currentSeconds` from it on every `_tick()`. A `visibilitychange` listener in the `WorkoutTimer` constructor forces an immediate catch-up (`tick()` / `reminder.sync()`) when the tab becomes visible. When changing timer logic, anything per-second belongs in `_step()`, not `tick()`.

**Voice announcement flags** (`halfwayAnnounced`, `lastTenAnnounced`, `nextExAnnounced`) are reset via `resetFlags()` on every exercise/rest transition to prevent duplicate speech.

**Progress bar** is a pure ASCII string built by `buildProgressBar(pct, width=24)` — fill with `█`, empty with `░`.

**Boot sequence** in `index.html` (`#bootSequence`) fades out and reveals `#mainContent` via timed `classList.add('visible')` on each `.boot-line` element. The notification permission status line is updated dynamically by `script.js` on DOMContentLoaded (`granted` → `✓ OK`, `denied` → `✗ denied`, `default` → keeps `⚠ permission req`). This is cosmetic only; the `WorkoutTimer` constructor runs regardless.

## Adding or Modifying Exercises

Edit the `exercises` array in `exercises.json`. Each entry needs `number`, `name`, `subtitle`, `duration` (seconds), `section`, `emoji`, and `description`. Rest period between exercises is `this.restTime = 5` (seconds), hardcoded in the constructor — a single voice cue fires at exercise end ("Prepare for next exercise." / "Prepare for next iteration." on the last exercise) with no countdown during the break.

**Preferred way**: use the backoffice TUI — `npx ./tools/backoffice` (zero-dependency Node TUI in `tools/backoffice/cli.js`). It reads `exercises.json` with `JSON.parse`, edits in memory, and rewrites the whole file on save. It validates dangling set→exercise references before saving. Can also be run inside the Docker container (see Docker section below).

**Exercise numbers are non-contiguous** — gaps are intentional from past refactors. Do not assume `EXERCISES[n]` is exercise number `n`; always use `.find(e => e.number === n)`.

To add or change **Sets**, edit the `sets` array in the same file. Each entry needs `number`, `name`, and `exercises` (an ordered array of exercise `number` values). `_resolveSetExercises()` in `script.js` maps these numbers to full `EXERCISES` objects at runtime — unmatched numbers are silently dropped (`.filter(Boolean)`). Set duration and exercise count are computed on the fly; no other changes are needed.

## Docker & local ops

The app is self-hostable via Docker. The image is `nginx:alpine` with the Node binary injected from `node:alpine` (latest) for the backoffice TUI. Port **7300**.

### Makefile targets

| Target | What it does |
|--------|-------------|
| `make up` | `portless proxy start` → `docker compose up -d --build` → `portless alias devstrechplus 7300` |
| `make down` | Stop and remove the container |
| `make build` | Rebuild image without starting |
| `make restart` | Restart container, no rebuild |
| `make logs` | `docker compose logs -f` |
| `make backoffice` | `docker exec -it -w /usr/share/nginx/html devstretch-plus node /app/backoffice/cli.js` |
| `make clean` | Remove container, image, and volumes |

`up.ps1` is the Windows equivalent of `make up` for machines without `make`.

### Backoffice inside Docker

```bash
make backoffice
```

The `-w /usr/share/nginx/html` working directory is what lets `findDataFile()` locate `exercises.json`. Edits are served immediately by nginx — no rebuild needed. Commit the updated `exercises.json` afterwards to keep git in sync.

### Ignore files

- `.vercelignore` — keeps `tools/`, `docs/`, `Makefile`, `up.ps1`, and all Docker files out of Vercel deploys
- `.dockerignore` — keeps `tools/` out of the image except `tools/backoffice/cli.js` (negation rule)

## Plans & Design Docs

Feature designs and implementation plans live in `docs/plans/` with the naming convention `YYYY-MM-DD-<topic>-design.md` (design) and `YYYY-MM-DD-<topic>.md` (implementation plan).

## Notifications

Notifications require HTTPS (or localhost) and user permission. The `NotificationManager` prefers the service worker path (`reg.showNotification`) for persistence; falls back to `new Notification()`. The nag timer (`_nagTimer` in `WorkoutTimer`) is a plain `setTimeout` chain — it stops when `_clearNagTimer()` is called or the tab is closed.
