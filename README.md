# ▸ DevStretch — Antiburnout Protocol

<p>
  <img src="screenshots/screenshot.jpg" alt="DevStretch app screenshot" width="700">
</p>

A PWA for developers who forget they have a body. 15 dev-themed exercises organized into 3 progressive Sets (6–11 min each), with automatic timers, voice guidance, and a stretch reminder that auto-starts the next set when it fires.

---

## Features

- **Stretch reminder countdown** — set a 20/45/60 min timer; alarm + voice fires when time is up, then auto-starts the next set. Start, pause, and reset independently
- **3 progressive Sets** — *Building* (light warm-up), *Committing* (moderate), *Pushing* (demanding). Cycle with `◀ ▶` or start on demand
- **15 dev-themed exercises** — `git commit --water`, `Lint Your Posture`, `Full Stack Reach`, and more
- **Voice guidance** — announces each exercise, halfway points, and transitions (toggleable)
- **Sound effects** — beeps, completion sounds (toggleable)
- **CLI progress bar** — `[████████░░░░░░░░] 50%`
- **Boot sequence** — because every good dev tool needs a startup screen
- **PWA** — installable on desktop and mobile, works fully offline
- **Dark terminal aesthetic** — green on black, JetBrains Mono

---

## Exercises

| # | Dev Name | Real Name |
|---|----------|-----------|
| 1 | Review That Code | Neck Stretch |
| 2 | Roll Back | Shoulder Rolls |
| 3 | Prevent Carpal Tunnel PR | Wrist Stretches |
| 4 | Deploy to Standing Position | Sit to Stand |
| 5 | Clear Cache | Eye Break |
| 6 | Refactor Your Spine | Seated Back Twist |
| 7 | Offline Mode | Walk Away |
| 8 | Memory Garbage Collection | Box Breathing |
| 9 | Extend Your Reach | Overhead Arm Stretch |
| 10 | Lint Your Posture | Posture Check |
| 11 | git commit --water | Hydration Reminder |
| 12 | Full Stack Reach | Deep Squat Rotation |
| 13 | Building the Core | Squats |
| 14 | Building the Core | Planks |
| 15 | Crawl Protocol | Quadruped Hold |

---

## Sets

Each set covers all sections, with 💧 always as the last exercise.

### Exercise reference

| # | Exercise | Section | Duration | Intensity |
|---|----------|---------|----------|-----------|
| 1 | Neck Stretch | ⚙️ CORE SYSTEMS | 30s | 🟢 light |
| 2 | Shoulder Rolls | ⚙️ CORE SYSTEMS | 30s | 🟢 light |
| 3 | Wrist Stretches | ⚙️ CORE SYSTEMS | 30s | 🟢 light |
| 4 | Sit to Stand | ⚙️ CORE SYSTEMS | 40s | 🟡 moderate |
| 12 | Deep Squat Rotation | ⚙️ CORE SYSTEMS | 50s | 🟡 moderate |
| 13 | Squats | ⚙️ CORE SYSTEMS | 40s | 🔴 demanding |
| 14 | Planks | ⚙️ CORE SYSTEMS | 40s | 🔴 demanding |
| 5 | Eye Break | 👁️ VISUAL REFRESH | 30s | 🟢 light |
| 6 | Seated Back Twist | 🦴 BACKEND MAINTENANCE | 30s | 🟢 light |
| 15 | Quadruped Hold | 🦴 BACKEND MAINTENANCE | 45s | 🟡 moderate |
| 7 | Walk Away | 🦴 BACKEND MAINTENANCE | 240s | 🟡 moderate |
| 8 | Box Breathing | 🧠 PROCESS MANAGEMENT | 120s | 🟢 light |
| 9 | Overhead Arm Stretch | 🧘 SHUTDOWN SEQUENCE | 30s | 🟢 light |
| 10 | Posture Check | 🧘 SHUTDOWN SEQUENCE | 20s | 🟢 light |
| 11 | git commit --water | 🧘 SHUTDOWN SEQUENCE | 40s | 💧 always last |

### Set composition

| Set | Exercises | ~Duration | Notes |
|-----|-----------|-----------|-------|
| 1 — **Building** | 1 → 2 → 3 → 5 → 6 → 8 → 10 → 💧 | ~6 min | Lightest; gentle upper-body warm-up only |
| 2 — **Committing** | 4 → 5 → 12 → 15 → 8 → 9 → 💧 | ~6 min | Moderate; lower body + core stability |
| 3 — **Pushing** | 5 → 4 → 12 → 13 → 14 → 8 → 9 → 7 → 💧 | ~11 min | Hardest; squats + planks + 4-min walk. Sweat mandatory |

---

## Usage

### Running locally

Any static file server works — no build step required:

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080`. Hard-refresh (`Ctrl+Shift+R`) after changes to bypass the service worker cache.

### Testing the stretch reminder

1. Select an interval (20/45/60 min) in the reminder row
2. Click `▶ START` — the main timer display counts down
3. Try `⏸ PAUSE` and `↺ RESET`
4. When the countdown hits zero, an alarm plays and voice says it's time to stretch

To test the fired state instantly, open the browser console and run:

```javascript
window.workoutTimer.reminder.start(0.05) // fires in ~3 seconds
```

### Testing Sets

1. Use `◀` / `▶` to cycle between *Building*, *Committing*, and *Pushing*
2. Click `▶ START SET` to play the current set on demand
3. To test auto-start on reminder fire, run `window.workoutTimer.reminder.start(0.05)` in the console — the next set starts automatically when it fires

---

## Stack

- **Vanilla HTML / CSS / JS** — no frameworks, no build tools
- **Web Speech API** — voice guidance
- **Web Notifications API** — stretch reminders via service worker
- **Service Worker** — offline support and PWA installability
- **JetBrains Mono** — because the font matters

---

## Roadmap

- [x] Stretch reminder countdown with start/pause/reset
- [x] Create the concept of a "Set" — curated groups of exercises, auto-started by the reminder
- [ ] More exercises and sets — eyes, hands, full body...

---

## License

[MIT](LICENSE)

---

## Credits

Forked from [highflyer910/devstretch](https://github.com/highflyer910/devstretch) — the original project by [@highflyer910](https://github.com/highflyer910).

**[🚀 Live Demo (original)](https://devstretch.vercel.app)**

---

*// It's a feature, not a bug.*
