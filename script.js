class WorkoutTimer {
    constructor() {
        this.currentSetIndex = 0;
        this.activeSetIndex = 0;
        this.notifications = new NotificationManager();

        this.reminder = new ReminderTimer();
        this.reminder.onTick = (secs, state) => { if (!this.isRunning) this.updateDisplay(); };
        this.reminder.onComplete = () => this._onReminderComplete();

        this._resolveSetExercises(); // sets this.exercises from SETS[0]
        this.wakeLock = null;
        this.currentExerciseIndex = 0;
        this.currentTime = 0;
        this.isRunning = false;
        this.isResting = false;
        this.restTime = 5;
        this.totalElapsedTime = 0;
        this.timer = null;
        this.soundEnabled = true;
        this.voiceEnabled = true;

        this.femaleVoice = null;
        window.speechSynthesis.onvoiceschanged = () => {
            const voices = window.speechSynthesis.getVoices();
            this.femaleVoice = voices.find(v =>
                v.lang.startsWith('en') &&
                (v.name.includes('Samantha') ||
                 v.name.includes('Zira') ||
                 v.name.includes('Karen') ||
                 v.name.includes('Google US English'))
            ) || null;
        };

        this.halfwayAnnounced = false;
        this.lastTenAnnounced = false;
        this.nextExAnnounced = false;
        this._nagTimer = null;
        this._lastTickTs = 0;       // wall-clock anchor so the timer survives background-tab throttling
        this._suppressCues = false; // mute sound/voice while fast-forwarding missed seconds

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            if (this.isRunning) {
                this.tick(); // catch up immediately instead of waiting for the next interval
            } else if (this.reminder.state === 'running') {
                this.reminder.sync();
            }
        });

        this.rebootBtn = document.getElementById('rebootBtn');
        if (this.rebootBtn) {
            this.rebootBtn.addEventListener('click', () => this.reset());
        }

        this.sounds = {
            beep: new Audio('sounds/beep-07a.wav'),
            start: new Audio('sounds/beep-01a.wav'),
            complete: new Audio('sounds/button-2.wav'),
            pause: new Audio('sounds/pause.wav'),
            reset: new Audio('sounds/button-3.wav')
        };

        this.initElements();
        this.bindEvents();
        this.updateDisplay();
        this.updateNavButtons();
        this.runBootSequence();
    }

    initElements() {
        this.timerText = document.getElementById('timerText');
        this.timerLabel = document.getElementById('timerLabel');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.progressText = document.getElementById('progressText');
        this.sectionBadge = document.getElementById('sectionBadge');
        this.exerciseName = document.getElementById('exerciseName');
        this.exerciseSubtitle = document.getElementById('exerciseSubtitle');
        this.exerciseDescription = document.getElementById('exerciseDescription');
        this.exerciseEmoji = document.getElementById('exerciseEmoji');
        this.statCurrent = document.getElementById('statCurrent');
        this.statTotal = document.getElementById('statTotal');
        this.statTotalTime = document.getElementById('statTotalTime');
        this.statElapsed = document.getElementById('statElapsed');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.soundToggle = document.getElementById('soundToggle');
        this.voiceToggle = document.getElementById('voiceToggle');
        this.reminderSelect = document.getElementById('reminderSelect');
        this.remStartBtn = document.getElementById('remStartBtn');
        this.remPauseBtn = document.getElementById('remPauseBtn');
        this.remResetBtn = document.getElementById('remResetBtn');
        this.controls = document.querySelector('.controls');
        this.exerciseInfo = document.getElementById('exerciseInfo');
        this.statusLine = document.getElementById('statusLine');
        this.setPrevBtn = document.getElementById('setPrevBtn');
        this.setNextBtn = document.getElementById('setNextBtn');
        this.setLabel   = document.getElementById('setLabel');
        this.setName    = document.getElementById('setName');

        const totalWorkoutTime = this.exercises.reduce((acc, ex) => acc + ex.duration, 0) + (this.exercises.length - 1) * this.restTime;
        this.statTotal.textContent = this.exercises.length;
        this.statTotalTime.textContent = `~${Math.ceil(totalWorkoutTime / 60)}m`;
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.prevBtn.addEventListener('click', () => this.skipTo(this.currentExerciseIndex - 1));
        this.nextBtn.addEventListener('click', () => this.skipTo(this.currentExerciseIndex + 1));
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.voiceToggle.addEventListener('click', () => this.toggleVoice());
        this.remStartBtn.addEventListener('click', () => this._reminderStart());
        this.remPauseBtn.addEventListener('click', () => this._reminderPause());
        this.remResetBtn.addEventListener('click', () => this._reminderReset());
        this.setPrevBtn.addEventListener('click', () => this._prevSet());
        this.setNextBtn.addEventListener('click', () => this._nextSet());
    }

    runBootSequence() {
        const bootEl = document.getElementById('bootSequence');
        const mainEl = document.getElementById('mainContent');
        const lines = bootEl.querySelectorAll('.boot-line');

        lines.forEach((line, i) => {
            setTimeout(() => {
                line.classList.add('visible');
                if (i === lines.length - 1) {
                    setTimeout(() => {
                        bootEl.style.opacity = '0';
                        bootEl.style.transition = 'opacity 0.5s';
                        setTimeout(() => {
                            bootEl.style.display = 'none';
                            mainEl.style.display = 'block';
                            mainEl.classList.add('fade-in');
                        }, 500);
                    }, 600);
                }
            }, i * 320);
        });
    }

    setStatus(msg) {
        if (this.statusLine) {
            this.statusLine.textContent = `> ${msg}`;
        }
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                this.setStatus('SYSTEM: Screen Wake Lock active');
                this.wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock was released');
                });
            }
        } catch (err) {
            this.setStatus(`WAKE LOCK ERROR: ${err.name}`);
        }
    }

    start() {
        if (this.isRunning) return;
        this._clearNagTimer();
        this.reminder.reset();
        this._updateReminderButtons();

        // Snapshot which set this session belongs to and resolve its exercises
        this.activeSetIndex = this.currentSetIndex;
        this._resolveSetExercises();
        this._updateSetNavButtons();

        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        this.updateNavButtons();
        this.requestWakeLock();

        if (this.currentExerciseIndex === 0 && this.currentTime === 0 && !this.isResting) {
            this.currentTime = this.exercises[0].duration;
            const ex = this.exercises[0];
            const setName = SETS[this.activeSetIndex].name;
            this.speak(`Starting ${setName}. Exercise 1: ${ex.name}.`);
            this.setStatus(`Running Set ${SETS[this.activeSetIndex].number}: ${ex.name}`);
        } else {
            const ex = this.exercises[this.currentExerciseIndex];
            this.speak(`Resuming. ${this.currentTime} seconds remaining.`);
            this.setStatus(`Resumed: ${ex.name}`);
        }

        this.updateDisplay();
        if (this.timer) clearInterval(this.timer);
        this._lastTickTs = Date.now();
        this.timer = setInterval(() => this.tick(), 1000);
        this.playSound('start');
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        this.startBtn.innerHTML = '<span class="btn-icon">▶</span><span>RESUME</span>';
        clearInterval(this.timer);
        this.playSound('pause');
        this.speak('Paused.');
        this.setStatus('PAUSED - click RESUME to continue');
        this.updateNavButtons();
    }

    reset() {
        this.isRunning = false;
        this.isResting = false;
        this.currentExerciseIndex = 0;
        this.currentTime = 0;
        this.totalElapsedTime = 0;
        this._resolveSetExercises(); // re-sync exercises to currentSetIndex
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        this.startBtn.innerHTML = '<span class="btn-icon">▶</span><span>START SET</span>';
        clearInterval(this.timer);
        this.resetFlags();
        this.exerciseInfo.style.display = 'block';
        this.controls.style.display = 'flex';
        document.getElementById('completionScreen').style.display = 'none';
        this.timerDisplay.classList.remove('rest-phase', 'complete-phase');
        this.updateDisplay();
        this.updateNavButtons();
        this._updateSetNavButtons();
        this.playSound('reset');
        this.setStatus('System reset. Ready to run.');
        this.speak('Reset. Ready to start.');
    }

    resetFlags() {
        this.halfwayAnnounced = false;
        this.lastTenAnnounced = false;
        this.nextExAnnounced = false;
    }

    skipTo(index) {
        if (index < 0 || index >= this.exercises.length) return;
        const wasRunning = this.isRunning;
        if (wasRunning) { clearInterval(this.timer); this.isRunning = false; }

        this.currentExerciseIndex = index;
        this.isResting = false;
        this.currentTime = this.exercises[index].duration;
        this.totalElapsedTime = this.exercises.slice(0, index).reduce((acc, ex) => acc + ex.duration + this.restTime, 0);
        this.resetFlags();
        this.updateDisplay();
        this.updateNavButtons();

        if (wasRunning) {
            this.isRunning = true;
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'flex';
            this._lastTickTs = Date.now();
            this.timer = setInterval(() => this.tick(), 1000);
        }
        const ex = this.exercises[index];
        this.speak(`Exercise ${ex.number}: ${ex.name}.`);
        this.setStatus(`Jumped to: ${ex.name}`);
    }

    tick() {
        // Browsers throttle background-tab intervals to ~1/min (or suspend them entirely),
        // so count elapsed wall-clock seconds instead of trusting one call per second.
        const steps = Math.floor((Date.now() - this._lastTickTs) / 1000);
        if (steps < 1) return;
        this._lastTickTs += steps * 1000;
        for (let i = steps; i > 0 && this.isRunning; i--) {
            this._suppressCues = i > 1; // only the final (current) second gets sound/voice
            this._step();
        }
        this._suppressCues = false;
    }

    _step() {
        this.currentTime--;
        this.totalElapsedTime++;

        if (this.isResting) {
            if (this.currentTime <= 0) {
                this.isResting = false;
                this.currentExerciseIndex++;
                // Reminder advanced the set mid-session — stop here instead of continuing
                if (this.currentSetIndex !== this.activeSetIndex) {
                    this.completeSet();
                    return;
                }
                if (this.currentExerciseIndex >= this.exercises.length) {
                    this.completeSet();
                    return;
                }
                this.currentTime = this.exercises[this.currentExerciseIndex].duration;
                this.resetFlags();
                const ex = this.exercises[this.currentExerciseIndex];
                this.playSound('start');
                this.speak(`Exercise ${ex.number}: ${ex.name}.`);
                this.setStatus(`Running: ${ex.name}`);
            }
        } else {
            const ex = this.exercises[this.currentExerciseIndex];
            const half = Math.floor(ex.duration / 2);

            if (ex.duration > 20 && this.currentTime === half && !this.halfwayAnnounced) {
                this.speak('Halfway there.'); this.halfwayAnnounced = true;
            }
            if (ex.duration > 20 && this.currentTime === 10 && !this.lastTenAnnounced) {
                this.speak('10 seconds left.'); this.lastTenAnnounced = true;
            }
            if (this.currentTime <= 3 && this.currentTime > 0) {
                this.playSound('beep');
                if (this.voiceEnabled) this.speak(String(this.currentTime));
            }

            if (this.currentTime <= 0) {
                this.playSound('complete');
                const isLastExercise = this.currentExerciseIndex === this.exercises.length - 1;
                this.speak(isLastExercise ? 'Prepare for next iteration.' : 'Prepare for next exercise.');
                this.isResting = true;
                this.currentTime = this.restTime;
                this.resetFlags();
                this.setStatus(`REST - next: ${this.exercises[this.currentExerciseIndex + 1]?.name || 'final'}`);
            }
        }
        this.updateDisplay();
    }

    buildProgressBar(pct, width = 24) {
        const filled = Math.round((pct / 100) * width);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${pct}%`;
    }

    updateDisplay() {
        const mins = String(Math.floor(this.currentTime / 60)).padStart(2, '0');
        const secs = String(this.currentTime % 60).padStart(2, '0');
        if (this.timerText) this.timerText.textContent = `${mins}:${secs}`;

        const eMins = String(Math.floor(this.totalElapsedTime / 60)).padStart(2, '0');
        const eSecs = String(this.totalElapsedTime % 60).padStart(2, '0');
        this.statElapsed.textContent = `${eMins}:${eSecs}`;

        if (this.isResting) {
            this.timerDisplay.classList.add('rest-phase');
            this.timerDisplay.classList.remove('active-phase');
            if (this.timerLabel) this.timerLabel.textContent = '// REST - recovering...';
            this.sectionBadge.textContent = '⏸  REST PERIOD';

            const nextIdx = this.currentExerciseIndex + 1;
            if (nextIdx < this.exercises.length) {
                const next = this.exercises[nextIdx];
                this.exerciseEmoji.textContent = next.emoji;
                this.exerciseName.textContent = next.name;
                this.exerciseSubtitle.textContent = `// ${next.subtitle}`;
                this.exerciseDescription.textContent = `NEXT UP: ${next.description}`;
            }

            const pct = Math.round(((this.restTime - this.currentTime) / this.restTime) * 100);
            this.progressText.textContent = this.buildProgressBar(pct);
            this.statCurrent.textContent = String(this.currentExerciseIndex + 1).padStart(2, '0');

        } else if (!this.isRunning && this.currentExerciseIndex === 0 && this.currentTime === 0) {
            const set = SETS[this.currentSetIndex];
            this.sectionBadge.textContent = '⚙️  READY TO BOOT';
            this.exerciseEmoji.textContent = '🖥️';
            this.exerciseName.textContent = `Set ${set.number} — ${set.name}`;
            this.exerciseSubtitle.textContent = `// ${this.exercises.length} exercises`;
            this.exerciseDescription.textContent = `${this.exercises.map(e => e.name).join(' → ')}. Click START SET to begin.`;
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
        } else {
            this.timerDisplay.classList.remove('rest-phase');
            this.timerDisplay.classList.add('active-phase');
            const ex = this.exercises[this.currentExerciseIndex];
            if (this.timerLabel) this.timerLabel.textContent = `// exercise ${ex.number} of ${this.exercises.length} running...`;
            this.sectionBadge.textContent = ex.section;
            this.exerciseEmoji.textContent = ex.emoji;
            this.exerciseName.textContent = ex.name;
            this.exerciseSubtitle.textContent = `// ${ex.subtitle}`;
            this.exerciseDescription.textContent = ex.description;

            const pct = Math.round(((ex.duration - this.currentTime) / ex.duration) * 100);
            this.progressText.textContent = this.buildProgressBar(pct);
            this.statCurrent.textContent = String(ex.number).padStart(2, '0');
        }
    }

    updateNavButtons() {
        this.prevBtn.disabled = this.currentExerciseIndex === 0;
        this.nextBtn.disabled = this.currentExerciseIndex === this.exercises.length - 1;
    }

    completeSet() {
        this._suppressCues = false; // completion cues always play, even during catch-up
        clearInterval(this.timer);
        this.isRunning = false;
        this.timerDisplay.classList.remove('rest-phase', 'active-phase');

        const mins = String(Math.floor(this.totalElapsedTime / 60)).padStart(2, '0');
        const secs = String(this.totalElapsedTime % 60).padStart(2, '0');
        const setName = SETS[this.activeSetIndex].name;
        const isLastSet = this.activeSetIndex === SETS.length - 1;

        this.playSound('complete');
        this.notifications.sendCustomNotification(
            'DevStretch Plus Set Complete! 🎉',
            `${setName} finished in ${mins}:${secs}. git push --body.`
        );

        if (isLastSet) {
            // All sets done — show full reboot/completion screen
            this.timerDisplay.classList.add('complete-phase');
            this.exerciseInfo.style.display = 'none';
            this.controls.style.display = 'none';
            document.getElementById('completionTime').textContent = `${mins}:${secs}`;
            document.getElementById('completionScreen').style.display = 'block';
            this.progressText.textContent = this.buildProgressBar(100);
            this.speak(`All sets complete! ${setName} done. Excellent work, developer.`);
            this.setStatus(`ALL SETS COMPLETE — ${setName} finished in ${mins}:${secs}`);
            this._updateSetNavButtons();
        } else {
            // More sets remain — advance to next set and return to ready state
            const nextIndex = this.activeSetIndex + 1;
            this.currentSetIndex = nextIndex;
            this._resolveSetExercises();
            this.updateSetDisplay();

            this.isResting = false;
            this.currentExerciseIndex = 0;
            this.currentTime = 0;
            this.totalElapsedTime = 0;
            this.startBtn.style.display = 'flex';
            this.pauseBtn.style.display = 'none';
            this.startBtn.innerHTML = '<span class="btn-icon">▶</span><span>START SET</span>';
            this.resetFlags();
            this.exerciseInfo.style.display = 'block';
            this.controls.style.display = 'flex';
            this.timerDisplay.classList.remove('complete-phase');
            this.updateDisplay();
            this.updateNavButtons();
            this._updateSetNavButtons();

            const nextName = SETS[nextIndex].name;
            this.speak(`${setName} complete. Excellent work! Up next: ${nextName}. Click Start Set when ready.`);
            this.setStatus(`SET COMPLETE — advancing to Set ${SETS[nextIndex].number}: ${nextName}`);
        }
    }

    playSound(type) {
        if (!this.soundEnabled || this._suppressCues) return;
        try { this.sounds[type]?.play(); } catch (e) {}
    }

    speak(text) {
        if (!this.voiceEnabled || this._suppressCues) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.95;
        if (this.femaleVoice) u.voice = this.femaleVoice;
        window.speechSynthesis.speak(u);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? '🔊 SND:ON' : '🔇 SND:OFF';
        this.soundToggle.classList.toggle('toggle-on', this.soundEnabled);
    }

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        this.voiceToggle.textContent = this.voiceEnabled ? '🎤 VOX:ON' : '🔕 VOX:OFF';
        this.voiceToggle.classList.toggle('toggle-on', this.voiceEnabled);
        if (this.voiceEnabled) {
            this.speak('Voice guidance enabled.');
        } else {
            window.speechSynthesis.cancel();
        }
    }

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
        this._clearNagTimer();
        this.reminder.reset();
        this._updateReminderButtons();
        this.updateDisplay();
        this.setStatus('Stretch reminder dismissed.');
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
        this.currentSetIndex = (this.currentSetIndex + 1) % SETS.length;
        this.updateSetDisplay();

        if (this.isRunning) {
            // Silent advance — tick() catches divergence at next exercise boundary
            this.playSound('complete');
            this.speak(`Time to stretch! Advancing to ${SETS[this.currentSetIndex].name} after this exercise.`);
            this.setStatus(`> Set advancing to Set ${SETS[this.currentSetIndex].number} — finishing current exercise`);
        } else {
            // Notify but don't auto-start — user must click START SET or dismiss
            this._resolveSetExercises();
            this.updateDisplay();
            this.speak(`Time to stretch! ${SETS[this.currentSetIndex].name} is ready. Start when you can.`);
            this.setStatus(`⏰ Stretch time! Click START SET, or ↺ to dismiss (nag in 3 min)`);
            this._startNagTimer();
        }

        this.notifications.sendCustomNotification(
            'Time to Stretch! 🧘',
            `Up next: ${SETS[this.currentSetIndex].name}. Stand up and stretch!`
        );
        this._updateReminderButtons();
    }

    _startNagTimer() {
        this._clearNagTimer();
        this._nagTimer = setTimeout(() => this._fireNag(), 3 * 60 * 1000);
    }

    _fireNag() {
        if (this.isRunning) { this._nagTimer = null; return; }
        this.playSound('complete');
        this.speak(`Still time to stretch! ${SETS[this.currentSetIndex].name} is waiting for you.`);
        this.setStatus(`⏰ Reminder: stretch time! Click START SET, or ↺ to dismiss`);
        this.notifications.sendCustomNotification(
            '🧘 Still time to stretch!',
            `${SETS[this.currentSetIndex].name} is waiting. Start when ready.`
        );
        this._nagTimer = setTimeout(() => this._fireNag(), 3 * 60 * 1000);
    }

    _clearNagTimer() {
        if (this._nagTimer) { clearTimeout(this._nagTimer); this._nagTimer = null; }
    }
    _resolveSetExercises() {
        const set = SETS[this.currentSetIndex];
        this.exercises = set.exercises
            .map(num => EXERCISES.find(e => e.number === num))
            .filter(Boolean);
    }

    updateSetDisplay() {
        const set = SETS[this.currentSetIndex];
        if (this.setLabel) this.setLabel.textContent = `SET ${set.number} / ${SETS.length}`;
        if (this.setName)  this.setName.textContent  = set.name;
        // Only update stats when not mid-session (running session owns the stats panel)
        if (!this.isRunning) {
            const totalSetTime = this.exercises.reduce((acc, ex) => acc + ex.duration, 0)
                               + (this.exercises.length - 1) * this.restTime;
            if (this.statTotal)     this.statTotal.textContent     = this.exercises.length;
            if (this.statTotalTime) this.statTotalTime.textContent = `~${Math.ceil(totalSetTime / 60)}m`;
        }
    }

    _prevSet() {
        if (this.isRunning || this.currentExerciseIndex > 0 || this.currentTime > 0) return;
        this.currentSetIndex = (this.currentSetIndex - 1 + SETS.length) % SETS.length;
        this._resolveSetExercises();
        this.updateSetDisplay();
        this.updateDisplay();
    }

    _nextSet() {
        if (this.isRunning || this.currentExerciseIndex > 0 || this.currentTime > 0) return;
        this.currentSetIndex = (this.currentSetIndex + 1) % SETS.length;
        this._resolveSetExercises();
        this.updateSetDisplay();
        this.updateDisplay();
    }

    _updateSetNavButtons() {
        const locked = this.isRunning || this.currentExerciseIndex > 0 || this.currentTime > 0;
        if (this.setPrevBtn) this.setPrevBtn.disabled = locked;
        if (this.setNextBtn) this.setNextBtn.disabled = locked;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-app-version]').forEach(el => {
        el.textContent = `v${APP_VERSION}`;
    });
    window.workoutTimer = new WorkoutTimer();
});