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

1. **`exercises.js`** — declares the global `EXERCISES` array. Each entry is a plain object with `number`, `name`, `subtitle`, `duration` (seconds), `section`, `emoji`, and `description`. This is the single source of truth for workout content and timing.

2. **`notifications.js`** — defines `NotificationManager` class. Manages Web Notifications permission, stand-up reminder intervals, and falls back between service worker notifications and `new Notification()`.

3. **`script.js`** — defines `WorkoutTimer` class, instantiated as `window.workoutTimer` on DOMContentLoaded. Owns all timer state, the full exercise flow (active → rest → next exercise → completion), Web Speech API voice guidance, Web Audio for sound effects, and the Screen Wake Lock. Reads `EXERCISES` from the global scope and creates a `NotificationManager` instance internally.

4. **`pwa.js`** — registers `sw.js` as a service worker and handles the `beforeinstallprompt` event to show/hide the `#installBtn`.

**`sw.js`** runs in its own worker scope. It caches all static assets at install time (`CACHE_NAME = 'devstretch-v1.1'`) and serves them cache-first. **When adding new assets (sounds, icons, etc.), add them to the `ASSETS` array in `sw.js` and bump `CACHE_NAME`** — otherwise the old cache will be served to returning users.

## Key Patterns

**Timer state machine** (`WorkoutTimer` in `script.js`): `isRunning` + `isResting` + `currentExerciseIndex` + `currentTime` fully define the session state. The `tick()` method decrements `currentTime` each second and handles the transitions: active exercise → rest period → next exercise → workout complete.

**Voice announcement flags** (`halfwayAnnounced`, `lastTenAnnounced`, `nextExAnnounced`) are reset via `resetFlags()` on every exercise/rest transition to prevent duplicate speech.

**Progress bar** is a pure ASCII string built by `buildProgressBar(pct, width=24)` — fill with `█`, empty with `░`.

**Boot sequence** in `index.html` (`#bootSequence`) fades out and reveals `#mainContent` via timed `classList.add('visible')` on each `.boot-line` element. This is cosmetic only; the `WorkoutTimer` constructor runs regardless.

## Adding or Modifying Exercises

Edit the `EXERCISES` array in `exercises.js`. The `WorkoutTimer` reads `this.exercises.length` and `reduce`s over `ex.duration` to compute total workout time — no other changes needed. Rest period between exercises is `this.restTime = 30` (seconds), hardcoded in the constructor.

## Notifications

Notifications require HTTPS (or localhost) and user permission. The `NotificationManager` prefers the service worker path (`reg.showNotification`) for persistence; falls back to `new Notification()`. Stand-up reminders are plain `setInterval`s — they stop if the tab is closed.
