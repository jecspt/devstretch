# Sets — Design

## Summary

Add a "Sets" concept: curated groups of exercises (~5 min each) that play sequentially when the stretch reminder fires. Sets replace the existing full 11-exercise workout mode. The user can manually cycle sets with on-screen `◀ ▶` buttons, and can also start a set on demand with `▶ START SET`.

## Data Structure (`exercises.js`)

Add a global `SETS` array alongside `EXERCISES`:

```js
const SETS = [
    { number: 1, name: "Core Systems",       exercises: [1, 2, 3, 4]     },
    { number: 2, name: "Recharge",           exercises: [5, 8, 11]       },
    { number: 3, name: "Shutdown Sequence",  exercises: [2, 6, 9, 10, 11] },
];
```

`exercises` is an ordered array of exercise numbers matching `EXERCISES[n].number`. Exercise 7 (Offline Mode, 4-min walk) is intentionally excluded from all sets — its duration would dominate any 5-min set; it remains available via manual skip during a session.

### Proposed sets (~5 min each)

| Set | Name | Exercises | ~Duration |
|-----|------|-----------|-----------|
| 1 | Core Systems | 1, 2, 3, 4 | 4.7 min |
| 2 | Recharge | 5, 8, 11 | 4.7 min |
| 3 | Shutdown Sequence | 2, 6, 9, 10, 11 | 5.7 min |

Durations include 30 s rest between exercises.

## State — `WorkoutTimer` (`script.js`)

Two new state variables:

- **`currentSetIndex`** — 0-based index into `SETS`; updated by the reminder auto-advance and the manual `◀ ▶` buttons.
- **`activeSetIndex`** — snapshot of `currentSetIndex` taken at `start()`; frozen for the life of the session.

### Session flow

1. `start()` snapshots `activeSetIndex = currentSetIndex`, resolves the exercise list from `SETS[currentSetIndex].exercises`, and begins playback of only those exercises.
2. `tick()` checks `currentSetIndex !== activeSetIndex` at every exercise boundary. If they diverged (reminder advanced the set mid-session), the session ends instead of continuing to the next exercise.
3. `completeSet()` replaces `completeWorkout()`. Fires when:
   - All exercises in the set finish naturally, **or**
   - `tick()` detects a mid-session set advance and stops early.

### Reminder integration

`_onReminderComplete` always:
1. Increments `currentSetIndex` (wraps to 0 after the last set).
2. Updates the set selector display.
3. **If no set is running** → also calls `start()` to auto-play the new set.
4. **If a set is running** → silently updates `currentSetIndex` only; `tick()` catches the divergence at the next exercise boundary and ends the session gracefully.

Status line shows: `> Set advanced to Set N — finishing current exercise`.

## UI Changes

### `▶ START WORKOUT` → `▶ START SET`

Same button, label only changes.

### New set selector row

Placed between the reminder row and the `#timerDisplay`:

```html
<div class="set-row">
    <button class="set-nav-btn" id="setPrevBtn">◀</button>
    <div class="set-info">
        <span id="setLabel">SET 1 / 3</span>
        <span id="setName">Core Systems</span>
    </div>
    <button class="set-nav-btn" id="setNextBtn">▶</button>
</div>
```

- `◀` / `▶` disabled while a set is actively playing.
- Set label (`SET N / T`) and name update live on every set change.
- When the reminder auto-advances mid-session, the selector immediately reflects the incoming set.

## Behaviour Summary

| Event | Result |
|---|---|
| Reminder fires, no set running | Advance set index, auto-start new set |
| Reminder fires, set running | Advance set index silently; session ends after current exercise |
| All set exercises complete | `completeSet()` — show completion, stop |
| User clicks `◀` / `▶` | Cycles `currentSetIndex`; disabled while playing |
| User clicks `▶ START SET` | Starts current set immediately |
| User clicks `↺ RESET` (workout) | Stops session, `activeSetIndex` cleared; set selector stays on current set |
