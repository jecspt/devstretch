# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevStretch is a no-build, no-framework PWA — vanilla HTML/CSS/JS only. There are no npm packages, no bundler, no transpilation step, and no test suite. To "run" the app, serve it over HTTP (browsers block certain APIs like service workers and notifications on `file://`).

```bash
# Any static file server works. Examples:
npx serve .
python -m http.server 8080
# Then open http://localhost:8080
```

When making changes, hard-refresh the browser (`Ctrl+Shift+R`) to bypass the service worker cache. To fully reset the cache during development, unregister the service worker in DevTools → Application → Service Workers.

## Architecture

Scripts load in this order (all `defer`, so DOMContentLoaded fires after all are parsed):

1. **`exercises.js`** — declares two globals: `EXERCISES` (11 plain objects, each with `number`, `name`, `subtitle`, `duration` (seconds), `section`, `emoji`, `description`) and `SETS` (3 curated groups of exercise numbers, ~5 min each). Both are the single source of truth for workout content and structure.

2. **`notifications.js`** — defines two classes: `NotificationManager` (Web Notifications permission + `showNotification` via service worker with `new Notification()` fallback) and `ReminderTimer` (standalone countdown with states `idle → running → paused → fired`; fires callbacks for sound/speech/notification when it hits zero).

3. **`script.js`** — defines `WorkoutTimer` class, instantiated as `window.workoutTimer` on DOMContentLoaded. Owns all timer state, set-based exercise playback (active → rest → next exercise → set complete), Web Speech API voice guidance, Web Audio for sound effects, and the Screen Wake Lock. Also holds a `ReminderTimer` instance; wires its `onTick`/`onComplete` callbacks, renders its countdown in the shared `#timerDisplay` when idle, and auto-starts the next set when the reminder fires. Starting a set calls `this.reminder.reset()` — the two timers are mutually exclusive.

4. **`pwa.js`** — registers `sw.js` as a service worker and handles the `beforeinstallprompt` event to show/hide the `#installBtn`.

**`sw.js`** runs in its own worker scope. It caches all static assets at install time (`CACHE_NAME = 'devstretch-v1.1'`) and serves them cache-first. **When adding new assets (sounds, icons, etc.), add them to the `ASSETS` array in `sw.js` and bump `CACHE_NAME`** — otherwise the old cache will be served to returning users.

## Key Patterns

**ReminderTimer state machine** (`notifications.js`): `idle → running → paused → fired`. `start(minutes)` begins the countdown; `pause()`/`resume()` freeze/continue it; `reset()` returns to idle. When `currentSeconds` hits 0, state becomes `fired`, `onComplete()` is called (plays alarm + speaks + sends notification), and the timer stops — manual restart required. `WorkoutTimer` reads `this.reminder.state` in `updateDisplay()`'s idle branch to show the countdown in the main `MM:SS` block.

To test the reminder: serve the app, open `http://localhost:8080`, hard-refresh (`Ctrl+Shift+R`), then try the `▶ START` / `⏸ PAUSE` / `↺ RESET` buttons in the reminder row. To test the fired state quickly, open the browser console and run `window.workoutTimer.reminder.start(0.05)` (~3 seconds).

**Sets** (`exercises.js` + `script.js`): `currentSetIndex` tracks which set is queued; `activeSetIndex` snapshots it at `start()` and stays frozen for the life of the session. `_resolveSetExercises()` rebuilds `this.exercises` from `SETS[currentSetIndex].exercises` (mapped to full `EXERCISES` objects, filtered to drop any unmatched numbers). When `ReminderTimer.onComplete` fires, `currentSetIndex` advances — if a set is running, `tick()` detects the divergence (`currentSetIndex !== activeSetIndex`) at the next exercise boundary and calls `completeSet()` instead of continuing; if idle, `start()` is called immediately.

**Timer state machine** (`WorkoutTimer` in `script.js`): `isRunning` + `isResting` + `currentExerciseIndex` + `currentTime` fully define the session state. The `tick()` method decrements `currentTime` each second and handles the transitions: active exercise → rest period → next exercise → set complete.

**Voice announcement flags** (`halfwayAnnounced`, `lastTenAnnounced`, `nextExAnnounced`) are reset via `resetFlags()` on every exercise/rest transition to prevent duplicate speech.

**Progress bar** is a pure ASCII string built by `buildProgressBar(pct, width=24)` — fill with `█`, empty with `░`.

**Boot sequence** in `index.html` (`#bootSequence`) fades out and reveals `#mainContent` via timed `classList.add('visible')` on each `.boot-line` element. This is cosmetic only; the `WorkoutTimer` constructor runs regardless.

## Adding or Modifying Exercises

Edit the `EXERCISES` array in `exercises.js`. Each entry needs `number`, `name`, `subtitle`, `duration` (seconds), `section`, `emoji`, and `description`. Rest period between exercises is `this.restTime = 30` (seconds), hardcoded in the constructor.

To add or change **Sets**, edit the `SETS` array in the same file. Each entry needs `number`, `name`, and `exercises` (an ordered array of exercise `number` values). `_resolveSetExercises()` in `script.js` maps these numbers to full `EXERCISES` objects at runtime — unmatched numbers are silently dropped (`.filter(Boolean)`). Set duration and exercise count are computed on the fly; no other changes are needed.

## Plans & Design Docs

Feature designs and implementation plans live in `docs/plans/` with the naming convention `YYYY-MM-DD-<topic>-design.md` (design) and `YYYY-MM-DD-<topic>.md` (implementation plan).

## Notifications

Notifications require HTTPS (or localhost) and user permission. The `NotificationManager` prefers the service worker path (`reg.showNotification`) for persistence; falls back to `new Notification()`. Stand-up reminders are plain `setInterval`s — they stop if the tab is closed.
