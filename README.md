# ▸ DevStretch Plus — Antiburnout Protocol

**[🚀 Live App](https://devstretchplus.vercel.app)**

A PWA for developers who forget they have a body. 13 dev-themed exercises organized into 3 progressive Sets (5–10 min each), with automatic timers, voice guidance, and a stretch reminder that auto-advances the next set when it fires.

---

## Features

- **Stretch reminder countdown** — set a 25/50/60 min timer; alarm + voice fires when time is up, then queues the next set. Start, pause, and reset independently
- **3 progressive Sets** — *Building* (light warm-up), *Committing* (moderate), *Pushing* (demanding). Cycle with `◀ ▶` or start on demand
- **13 dev-themed exercises** — `git commit --water`, `Lint Your Posture`, `Full Stack Reach`, and more
- **Voice guidance** — announces each exercise, halfway points, and transitions (toggleable)
- **Sound effects** — beeps, completion sounds (toggleable)
- **CLI progress bar** — `[████████░░░░░░░░] 50%`
- **Boot sequence** — because every good dev tool needs a startup screen
- **PWA** — installable on desktop and mobile, works fully offline
- **Docker** — self-hostable with a single `docker compose up -d --build`
- **Dark terminal aesthetic** — green on black, JetBrains Mono

---

## Exercises & Sets

### Exercises

| # | Exercise | Section | Duration |
|---|----------|---------|----------|
| 1 | Boot Sequence | 🧘 BOOT SEQUENCE | 60s |
| 2 | Clear Cache | 🧘 BOOT SEQUENCE | 15s |
| 3 | Refactor Your Spine | 🦴 BACKEND MAINTENANCE | 30s |
| 7 | Offline Mode | 🦴 BACKEND MAINTENANCE | 240s |
| 8 | Memory Garbage Collection | 🧠 PROCESS MANAGEMENT | 120s |
| 9 | Extend Your Reach | 🧘 SHUTDOWN SEQUENCE | 30s |
| 10 | Lint Your Posture | 🧘 SHUTDOWN SEQUENCE | 20s |
| 11 | git commit --water | 🧘 SHUTDOWN SEQUENCE | 15s |
| 12 | Full Stack Reach | ⚙️ CORE SYSTEMS | 50s |
| 13 | Building the Core — Squats | ⚙️ CORE SYSTEMS | 40s |
| 14 | Building the Core — Planks | ⚙️ CORE SYSTEMS | 60s |
| 15 | Crawl Protocol | 🦴 BACKEND MAINTENANCE | 30s |
| 16 | Stretch Protocol | 🦴 BACKEND MAINTENANCE | 30s |

### Set composition

| Set | Sequence | ~Duration |
|-----|----------|-----------|
| 1 — **Building** | Clear Cache → Refactor Your Spine → Extend Your Reach → Lint Your Posture → git commit --water → Box Breathing | ~5 min |
| 2 — **Committing** | Clear Cache → Boot Sequence → Extend Your Reach → Full Stack Reach → Crawl Protocol → Stretch Protocol → git commit --water | ~5 min |
| 3 — **Pushing** | Boot Sequence → Clear Cache → Full Stack Reach → Squats → Planks → Stretch Protocol → git commit --water → Offline Mode | ~10 min |

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

### Self-hosting with Docker

```bash
git clone <repo>
cd devstretch
make up
# or on Windows without make:
.\up.ps1
```

The container uses `nginx:alpine` and runs on port **7300**. `restart: always` means it survives reboots and crashes automatically. Both commands also register a [portless](https://github.com/vercel-labs/portless) alias so the app is reachable at `https://devstrechplus.localhost` in addition to `http://localhost:7300`.

#### Makefile targets

| Target | What it does |
|--------|-------------|
| `make up` | Build image, start container, register portless alias |
| `make down` | Stop and remove the container |
| `make build` | Rebuild the image without starting |
| `make restart` | Restart the container (no rebuild) |
| `make logs` | Tail container logs |
| `make backoffice` | Open the backoffice TUI inside the running container |
| `make clean` | Stop container and remove image and volumes |

To update content after editing `exercises.json`:

```bash
make up   # rebuilds the image with the new file
```

### Versioning

The app version is stored in two places that are always kept in sync: `version.js` (read by the UI) and `sw.js` (hardcoded directly). `sw.js` owns its own copy because the browser's service worker update check does a **byte-diff on `sw.js`** — if `sw.js` never changes bytes, users stay on the old cached version forever. When `sw.js` changes, the browser installs a new service worker with a new `CACHE_NAME`, evicting the old cache automatically.

The patch version is auto-bumped by a git `pre-commit` hook on every commit to `master`. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

To bump minor/major instead, edit `version.js` in the same commit — the hook skips auto-bumping when `version.js` is already staged.

### Backoffice (content management TUI)

A zero-dependency terminal UI for editing exercises, sets, and sections without touching `exercises.json` by hand.

**Locally:**

```bash
npx ./tools/backoffice
# or
node tools/backoffice/cli.js
```

**Inside the running Docker container:**

```bash
make backoffice
# or manually:
docker exec -it -w /usr/share/nginx/html devstretch-plus node /app/backoffice/cli.js
```

Edits made inside the container take effect immediately (nginx serves the file live). Commit the updated `exercises.json` afterwards to keep git and the image in sync.

Features:
- **Exercises** — table view; edit any field inline, pick the section from a dropdown (or create a new one), add/delete. Renumbering an exercise updates every set that references it.
- **Sets** — edit name/number and the exercise sequence: replace in-place (`Enter`), add after (`a`), remove (`d`), reorder (`[` / `]`).
- **Sections** — list, add, and rename (renames cascade to all exercises).
- Saving validates first: sets referencing missing exercise numbers are flagged with an option to strip them.

### Testing the stretch reminder

1. Select an interval (25/50/60 min) in the reminder row
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
3. To test auto-advance on reminder fire: `window.workoutTimer.reminder.start(0.05)` in the console

---

## Stack

- **Vanilla HTML / CSS / JS** — no frameworks, no build tools
- **Web Speech API** — voice guidance
- **Web Notifications API** — stretch reminders via service worker
- **Service Worker** — offline support and PWA installability
- **nginx:alpine + Docker** — self-hosting
- **JetBrains Mono** — because the font matters

---

## Roadmap

- [x] Stretch reminder countdown with start/pause/reset
- [x] Sets — curated exercise groups, auto-queued by the reminder
- [x] Background-tab resilience — wall-clock timers survive browser throttling
- [x] Backoffice TUI — manage exercises/sets/sections without editing JS by hand
- [x] Docker self-hosting
- [ ] More exercises and sets — eyes, hands, full body...

---

## License

[MIT](LICENSE)

---

## Credits

Forked from [highflyer910/devstretch](https://github.com/highflyer910/devstretch) — the original project by [@highflyer910](https://github.com/highflyer910).

---

*// It's a feature, not a bug.*
