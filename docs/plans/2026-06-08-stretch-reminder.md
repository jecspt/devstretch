# Stretch Reminder Countdown Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a visible countdown timer that fires an alarm + voice reminder at a chosen interval, using the existing main `MM:SS` display when no workout is running.

**Architecture:** A new `ReminderTimer` class (appended to `notifications.js`) owns the countdown state and fires callbacks for sound/speech/notification. `WorkoutTimer` wires up those callbacks and reads `ReminderTimer` state in its `updateDisplay()` idle branch to render the countdown in the shared `#timerDisplay`. Starting the workout resets the reminder; they are mutually exclusive.

**Tech Stack:** Vanilla JS (no frameworks, no build step). Serve with `npx serve .` or `python -m http.server 8080` and test in browser at `http://localhost:8080`. Hard-refresh (`Ctrl+Shift+R`) to bypass the service worker cache between changes.

---

### Task 1: Add `ReminderTimer` class to `notifications.js`

**Files:**
- Modify: `notifications.js` (append after closing `}` of `NotificationManager`)

**Step 1: Append the class**

Add this at the bottom of `notifications.js`, after the `NotificationManager` closing brace:

```javascript
class ReminderTimer {
    constructor() {
        this.totalSeconds = 0;
        this.currentSeconds = 0;
        this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'fired'
        this._interval = null;
        this.onTick = null;     // (seconds, state) => void — called each second and on state changes
        this.onComplete = null; // () => void — called when countdown hits 0
    }

    start(minutes) {
        if (this.state === 'running') return;
        this.totalSeconds = minutes * 60;
        this.currentSeconds = this.totalSeconds;
        this.state = 'running';
        this._clearInterval();
        this._interval = setInterval(() => this._tick(), 1000);
        if (this.onTick) this.onTick(this.currentSeconds, this.state);
    }

    resume() {
        if (this.state !== 'paused') return;
        this.state = 'running';
        this._interval = setInterval(() => this._tick(), 1000);
        if (this.onTick) this.onTick(this.currentSeconds, this.state);
    }

    pause() {
        if (this.state !== 'running') return;
        this.state = 'paused';
        this._clearInterval();
        if (this.onTick) this.onTick(this.currentSeconds, this.state);
    }

    reset() {
        this._clearInterval();
        this.currentSeconds = 0;
        this.state = 'idle';
        if (this.onTick) this.onTick(0, 'idle');
    }

    _tick() {
        this.currentSeconds--;
        if (this.currentSeconds <= 0) {
            this.currentSeconds = 0;
            this.state = 'fired';
            this._clearInterval();
            if (this.onTick) this.onTick(0, 'fired');
            if (this.onComplete) this.onComplete();
        } else {
            if (this.onTick) this.onTick(this.currentSeconds, this.state);
        }
    }

    _clearInterval() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
}
```

**Step 2: Verify manually**

Open browser console and paste:
```javascript
const r = new ReminderTimer();
r.onTick = (s, state) => console.log(state, s);
r.onComplete = () => console.log('FIRED');
r.start(0.05); // ~3 seconds
```
Expected: logs `running 3`, `running 2`, `running 1`, `running 0`, `fired 0`, `FIRED`.

**Step 3: Commit**

```bash
git add notifications.js
git commit -m "feat: add ReminderTimer class with start/pause/resume/reset"
```

---

### Task 2: Update `index.html`

**Files:**
- Modify: `index.html`

**Step 1: Remove `#notifToggle` from `top-controls`**

Delete this line from the `<div class="top-controls">` block:
```html
<button class="toggle-btn" id="notifToggle">🔔 NOTIF:OFF</button>
```

**Step 2: Replace the `notif-row`**

Replace the entire `<div class="notif-row">` block:

Old:
```html
<div class="notif-row">
    <span class="notif-label">// stand-up reminder:</span>
    <select class="notif-select" id="reminderSelect">
        <option value="20">every 20m</option>
        <option value="45" selected>every 45m</option>
        <option value="60">every 60m</option>
    </select>
</div>
```

New:
```html
<div class="notif-row">
    <span class="notif-label">// remind me in:</span>
    <select class="notif-select" id="reminderSelect">
        <option value="20">20m</option>
        <option value="45" selected>45m</option>
        <option value="60">60m</option>
    </select>
    <div class="rem-controls">
        <button class="rem-btn rem-active" id="remStartBtn">▶ START</button>
        <button class="rem-btn" id="remPauseBtn" disabled>⏸ PAUSE</button>
        <button class="rem-btn" id="remResetBtn" disabled>↺ RESET</button>
    </div>
</div>
```

**Step 3: Verify manually**

Load the page. The notification toggle should be gone. The reminder row should show the interval select and three buttons (START active, PAUSE and RESET greyed out). No JS wiring yet — buttons do nothing.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: replace notif toggle with reminder countdown controls"
```

---

### Task 3: Update `style.css`

**Files:**
- Modify: `style.css`

**Step 1: Update `.notif-row` and `.notif-select`**

Replace the existing `.notif-row` and `.notif-select` rules:

Old:
```css
.notif-row {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    align-items: center;
}
```

New:
```css
.notif-row {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    align-items: center;
    flex-wrap: wrap;
}
```

Old `.notif-select`:
```css
.notif-select {
    font-family: var(--font);
    font-size: 0.7rem;
    background: var(--bg-surface);
    color: var(--text-dim);
    border: 1px solid var(--border-bright);
    padding: 4px 8px;
    cursor: pointer;
    flex: 1;
}
```

New `.notif-select` (remove `flex: 1`, add fixed width so buttons fit):
```css
.notif-select {
    font-family: var(--font);
    font-size: 0.7rem;
    background: var(--bg-surface);
    color: var(--text-dim);
    border: 1px solid var(--border-bright);
    padding: 4px 8px;
    cursor: pointer;
    width: 68px;
}
```

**Step 2: Add `.rem-controls` and `.rem-btn` rules**

Append after the `.notif-select option` rule:

```css
.rem-controls {
    display: flex;
    gap: 4px;
    flex: 1;
}

.rem-btn {
    flex: 1;
    font-family: var(--font);
    font-size: 0.65rem;
    font-weight: 600;
    background: var(--bg-surface);
    color: var(--text-dim);
    border: 1px solid var(--border-bright);
    padding: 4px 6px;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.04em;
    white-space: nowrap;
    text-align: center;
}

.rem-btn:hover:not(:disabled) {
    border-color: var(--green-dim);
    color: var(--green-dim);
}

.rem-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.rem-btn.rem-active {
    border-color: var(--green);
    color: var(--green);
    background: var(--green-faint);
}
```

**Step 3: Verify manually**

Reload. The reminder row should show: `// remind me in:` label, compact interval select, then three evenly-spaced buttons. START should be green-highlighted. PAUSE and RESET should be dimmed.

**Step 4: Commit**

```bash
git add style.css
git commit -m "feat: add styles for reminder countdown controls"
```

---

### Task 4: Wire `ReminderTimer` into `WorkoutTimer` in `script.js`

**Files:**
- Modify: `script.js`

This is the largest task. Make the changes in this order to avoid breaking the app mid-edit.

**Step 1: Create `ReminderTimer` instance and wire callbacks in constructor**

In the `WorkoutTimer` constructor, directly after `this.notifications = new NotificationManager();`, add:

```javascript
this.reminder = new ReminderTimer();
this.reminder.onTick = (secs, state) => { if (!this.isRunning) this.updateDisplay(); };
this.reminder.onComplete = () => this._onReminderComplete();
```

**Step 2: Add reminder element references in `initElements()`**

Inside `initElements()`, after `this.statusLine = document.getElementById('statusLine');`, add:

```javascript
this.remStartBtn = document.getElementById('remStartBtn');
this.remPauseBtn = document.getElementById('remPauseBtn');
this.remResetBtn = document.getElementById('remResetBtn');
```

Also **remove** this line from `initElements()` (element no longer exists in HTML):
```javascript
this.notifToggle = document.getElementById('notifToggle');
```

**Step 3: Update `bindEvents()`**

**Remove** these lines from `bindEvents()`:
```javascript
this.notifToggle.addEventListener('click', () => this.toggleNotifications());
this.reminderSelect.addEventListener('change', (e) => {
    const mins = parseInt(e.target.value);
    this.notifications.intervalMinutes = mins;
    if (this.notifications.isActive) {
        this.notifications.startReminder(mins);
        this.setStatus(`Stand-up reminder updated: every ${mins} min`);
    }
});
```

**Add** in their place:
```javascript
this.remStartBtn.addEventListener('click', () => this._reminderStart());
this.remPauseBtn.addEventListener('click', () => this._reminderPause());
this.remResetBtn.addEventListener('click', () => this._reminderReset());
```

**Step 4: Reset reminder when workout starts**

In the `start()` method, add these two lines at the very beginning (before `if (this.isRunning) return;`):

```javascript
this.reminder.reset();
this._updateReminderButtons();
```

Wait — add them AFTER `if (this.isRunning) return;` so a running workout doesn't trigger them unnecessarily:

```javascript
start() {
    if (this.isRunning) return;
    this.reminder.reset();
    this._updateReminderButtons();
    this.isRunning = true;
    // ... rest of method unchanged
```

**Step 5: Update the idle branch of `updateDisplay()`**

Find this block in `updateDisplay()`:

```javascript
} else if (!this.isRunning && this.currentExerciseIndex === 0 && this.currentTime === 0) {
    this.timerDisplay.classList.remove('rest-phase', 'active-phase');
    if (this.timerLabel) this.timerLabel.textContent = '// awaiting input...';
    this.sectionBadge.textContent = '⚙️  READY TO BOOT';
    this.exerciseEmoji.textContent = '🖥️';
    this.exerciseName.textContent = 'DevStretch Protocol';
    this.exerciseSubtitle.textContent = '// antiburnout system for developers';
    this.exerciseDescription.textContent = '11 exercises. ~18 minutes. Automatic timers. Voice guidance. Your body will thank you. Click START to initialize.';
    this.progressText.textContent = this.buildProgressBar(0);
    this.statCurrent.textContent = '00';
```

Replace it with:

```javascript
} else if (!this.isRunning && this.currentExerciseIndex === 0 && this.currentTime === 0) {
    this.sectionBadge.textContent = '⚙️  READY TO BOOT';
    this.exerciseEmoji.textContent = '🖥️';
    this.exerciseName.textContent = 'DevStretch Protocol';
    this.exerciseSubtitle.textContent = '// antiburnout system for developers';
    this.exerciseDescription.textContent = '11 exercises. ~18 minutes. Automatic timers. Voice guidance. Your body will thank you. Click START to initialize.';
    this.progressText.textContent = this.buildProgressBar(0);
    this.statCurrent.textContent = '00';

    const rs = this.reminder.state;
    if (rs === 'running') {
        const m = String(Math.floor(this.reminder.currentSeconds / 60)).padStart(2, '0');
        const s = String(this.reminder.currentSeconds % 60).padStart(2, '0');
        if (this.timerText) this.timerText.textContent = `${m}:${s}`;
        if (this.timerLabel) this.timerLabel.textContent = '// stretch reminder running...';
        this.timerDisplay.classList.remove('rest-phase');
        this.timerDisplay.classList.add('active-phase');
    } else if (rs === 'paused') {
        const m = String(Math.floor(this.reminder.currentSeconds / 60)).padStart(2, '0');
        const s = String(this.reminder.currentSeconds % 60).padStart(2, '0');
        if (this.timerText) this.timerText.textContent = `${m}:${s}`;
        if (this.timerLabel) this.timerLabel.textContent = '// stretch reminder paused';
        this.timerDisplay.classList.add('rest-phase');
        this.timerDisplay.classList.remove('active-phase');
    } else if (rs === 'fired') {
        if (this.timerText) this.timerText.textContent = '00:00';
        if (this.timerLabel) this.timerLabel.textContent = '// time to stretch! ⏰';
        this.timerDisplay.classList.remove('rest-phase');
        this.timerDisplay.classList.add('active-phase');
    } else {
        if (this.timerText) this.timerText.textContent = '00:00';
        if (this.timerLabel) this.timerLabel.textContent = '// awaiting input...';
        this.timerDisplay.classList.remove('rest-phase', 'active-phase');
    }
```

**Step 6: Add the four new private methods**

Append these methods to the `WorkoutTimer` class, before the closing `}` of the class (before `document.addEventListener`):

```javascript
async _reminderStart() {
    const mins = parseInt(this.reminderSelect.value);
    if (this.reminder.state === 'paused') {
        this.reminder.resume();
    } else {
        await this.notifications.requestPermission();
        this.reminder.start(mins);
    }
    this._updateReminderButtons();
    this.setStatus(`Stretch reminder started: ${mins} min countdown`);
}

_reminderPause() {
    this.reminder.pause();
    this._updateReminderButtons();
    this.setStatus('Stretch reminder paused.');
}

_reminderReset() {
    this.reminder.reset();
    this._updateReminderButtons();
    this.updateDisplay();
    this.setStatus('Stretch reminder reset.');
}

_updateReminderButtons() {
    const s = this.reminder.state;
    this.remStartBtn.disabled = s === 'running';
    this.remStartBtn.textContent = s === 'paused' ? '▶ RESUME' : '▶ START';
    this.remPauseBtn.disabled = s !== 'running';
    this.remResetBtn.disabled = s === 'idle';
    this.remStartBtn.classList.toggle('rem-active', s !== 'running');
    this.remPauseBtn.classList.toggle('rem-active', s === 'running');
}

_onReminderComplete() {
    this.playSound('complete');
    this.speak('Time to stretch! Stand up and take a break. Your body filed a bug report.');
    this.notifications.sendCustomNotification(
        'Time to Stretch! 🧘',
        'Your DevStretch reminder fired. Stand up and take a break.'
    );
    this._updateReminderButtons();
    this.setStatus('STRETCH REMINDER — time to take a break!');
}
```

**Step 7: Remove the `toggleNotifications()` method**

Delete the entire `async toggleNotifications()` method from `WorkoutTimer` — it's no longer called.

**Step 8: Verify manually**

Test each flow:

1. **Start reminder** — select 20m, click `▶ START`. Main display should show `19:59`, `19:58`... counting down. Label shows `// stretch reminder running...` (green border). START becomes disabled; PAUSE and RESET become active.

2. **Pause reminder** — click `⏸ PAUSE`. Display freezes. Label shows `// stretch reminder paused` (amber border). START changes to `▶ RESUME`.

3. **Resume reminder** — click `▶ RESUME`. Countdown continues from where it left. Button reverts to `▶ START` (disabled).

4. **Reset reminder** — click `↺ RESET`. Display returns to `00:00` / `// awaiting input...`. START re-enabled; PAUSE/RESET disabled.

5. **Fired state** (test with 1m or set a tiny interval) — when countdown hits 0: alarm plays, voice says "Time to stretch!", display shows `00:00` / `// time to stretch! ⏰` (green border). START re-enables to allow a fresh countdown.

6. **Start workout cancels reminder** — start a reminder, then click `▶ START WORKOUT`. Reminder should reset (display switches to workout timer, reminder buttons reset to idle state).

7. **Notification permission** — first START should trigger browser permission prompt if not yet granted.

**Step 9: Commit**

```bash
git add script.js
git commit -m "feat: wire ReminderTimer into WorkoutTimer — countdown in shared display"
```

---

### Final verification checklist

- [ ] Reminder countdown displays correctly in the main MM:SS block when idle
- [ ] Green border (`active-phase`) when running, amber (`rest-phase`) when paused
- [ ] `// time to stretch! ⏰` label and alarm+voice fire at zero
- [ ] Starting the workout resets the reminder; buttons return to idle state
- [ ] PAUSE→RESUME preserves the remaining time
- [ ] Notification permission is requested on first START (not on page load)
- [ ] Works correctly when notification permission is denied (alarm+voice still fire)
- [ ] No console errors on page load
