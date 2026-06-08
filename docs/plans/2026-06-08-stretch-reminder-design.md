# Stretch Reminder Countdown — Design

## Summary

Add a visible countdown timer to DevStretch that reminds the user to stretch at a chosen interval (20/45/60 min). When the countdown reaches zero it plays an alarm sound and a voice reminder, then stops and waits for manual restart. Starting the full 11-exercise workout cancels the reminder. The main `MM:SS` display is shared between the workout timer and the reminder countdown.

## UI Changes

- Remove `#notifToggle` from the top controls bar.
- Transform `notif-row` into a reminder control strip: keep the interval `<select>` (20/45/60m) and add three inline buttons — `▶ START`, `⏸ PAUSE`, `↺ RESET`.
- The main `#timerDisplay` is shared:
  - Idle, no reminder → `00:00` / `// awaiting input...` (unchanged)
  - Reminder running → countdown + `// stretch reminder running...`
  - Reminder fired → `00:00` / `// time to stretch!`, holds until manually restarted
  - Workout started → workout takes over, reminder is stopped and reset

## New `ReminderTimer` Class (in `notifications.js`)

Owns the reminder countdown state independently of `WorkoutTimer`.

- `start(minutes, callbacks)` — requests notification permission if needed, starts a 1-second `setInterval`, counts `currentSeconds` down from `minutes × 60`
- `pause()` / `resume()`
- `reset()` — clears interval, restores `currentSeconds` to the chosen duration, state → idle
- `onComplete()` — invokes caller-supplied callbacks for sound, speech, and notification; stops interval

Callbacks pattern keeps `ReminderTimer` decoupled from `WorkoutTimer`'s Audio objects.

## WorkoutTimer Integration

- `WorkoutTimer.start()` calls `reminderTimer.reset()` — the two are mutually exclusive.
- `WorkoutTimer.updateDisplay()` checks `reminderTimer` state in the idle branch to render the reminder countdown in the shared timer display.
- Sound (`playSound('complete')`) and speech are triggered via callbacks passed from `WorkoutTimer` to `ReminderTimer` at construction time — no Audio duplication.

## Behaviour Summary

| Event | Result |
|---|---|
| Countdown hits 0 | Alarm + voice + notification; stops and waits |
| User clicks RESET | Returns to chosen interval, does not auto-start |
| User clicks PAUSE mid-countdown | Freezes countdown; RESUME continues from same second |
| User starts full workout | Reminder resets and stops; workout owns the display |
| Notification permission denied | Reminder still counts down and fires alarm+voice; notification silently skipped |
