class WorkoutTimer {
    constructor() {
        this.exercises = EXERCISES;
        this.notifications = new NotificationManager();

        this.wakeLock = null;
        this.currentExerciseIndex = 0;
        this.currentTime = 0;
        this.isRunning = false;
        this.isResting = false;
        this.restTime = 30;
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
        this.notifToggle = document.getElementById('notifToggle');
        this.reminderSelect = document.getElementById('reminderSelect');
        this.controls = document.querySelector('.controls');
        this.exerciseInfo = document.getElementById('exerciseInfo');
        this.statusLine = document.getElementById('statusLine');

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
        this.notifToggle.addEventListener('click', () => this.toggleNotifications());
        this.reminderSelect.addEventListener('change', (e) => {
            const mins = parseInt(e.target.value);
            this.notifications.intervalMinutes = mins;
            if (this.notifications.isActive) {
                this.notifications.startReminder(mins);
                this.setStatus(`Stand-up reminder updated: every ${mins} min`);
            }
        });
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
        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        this.updateNavButtons();

        if (this.currentExerciseIndex === 0 && this.currentTime === 0 && !this.isResting) {
            this.currentTime = this.exercises[0].duration;
            const ex = this.exercises[0];
            this.speak(`Starting DevStretch. Exercise 1: ${ex.name}. ${ex.description}`);
            this.setStatus(`Running: ${ex.name}`);
        } else {
            const ex = this.exercises[this.currentExerciseIndex];
            this.speak(`Resuming. ${this.currentTime} seconds remaining.`);
            this.setStatus(`Resumed: ${ex.name}`);
        }

        this.updateDisplay();
        if (this.timer) clearInterval(this.timer);
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
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        this.startBtn.innerHTML = '<span class="btn-icon">▶</span><span>START WORKOUT</span>';
        clearInterval(this.timer);
        this.resetFlags();
        this.exerciseInfo.style.display = 'block';
        this.controls.style.display = 'flex';
        document.getElementById('completionScreen').style.display = 'none';
        this.timerDisplay.classList.remove('rest-phase', 'complete-phase');
        this.updateDisplay();
        this.updateNavButtons();
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
            this.timer = setInterval(() => this.tick(), 1000);
        }
        const ex = this.exercises[index];
        this.speak(`Exercise ${ex.number}: ${ex.name}.`);
        this.setStatus(`Jumped to: ${ex.name}`);
    }

    tick() {
        this.currentTime--;
        this.totalElapsedTime++;

        if (this.isResting) {
            if (this.currentTime <= 0) {
                this.isResting = false;
                this.currentExerciseIndex++;
                if (this.currentExerciseIndex >= this.exercises.length) {
                    this.completeWorkout();
                    return;
                }
                this.currentTime = this.exercises[this.currentExerciseIndex].duration;
                this.resetFlags();
                const ex = this.exercises[this.currentExerciseIndex];
                this.playSound('start');
                this.speak(`Exercise ${ex.number}: ${ex.name}.`);
                this.setStatus(`Running: ${ex.name}`);
            } else {
                // Announce next exercise name only (short, not full description)
                if (this.currentTime === this.restTime - 5 && !this.nextExAnnounced) {
                    const next = this.exercises[this.currentExerciseIndex + 1];
                    if (next) { this.speak(`Next: ${next.name}.`); this.nextExAnnounced = true; }
                }
                // 10 sec warning only if rest is longer than 15 sec
                if (this.restTime > 15 && this.currentTime === 10 && !this.lastTenAnnounced) {
                    this.speak('10 seconds. Get ready.'); this.lastTenAnnounced = true;
                }
                // countdown: beep always, voice only if currently enabled
                if (this.currentTime <= 3 && this.currentTime > 0) {
                    this.playSound('beep');
                    if (this.voiceEnabled) this.speak(String(this.currentTime));
                }
            }
        } else {
            const ex = this.exercises[this.currentExerciseIndex];
            const half = Math.floor(ex.duration / 2);

            // Halfway only if exercise is longer than 20 sec
            if (ex.duration > 20 && this.currentTime === half && !this.halfwayAnnounced) {
                this.speak('Halfway there.'); this.halfwayAnnounced = true;
            }
            // 10 sec warning only if exercise is longer than 20 sec
            if (ex.duration > 20 && this.currentTime === 10 && !this.lastTenAnnounced) {
                this.speak('10 seconds left.'); this.lastTenAnnounced = true;
            }
            // countdown: beep always, voice only if currently enabled
            if (this.currentTime <= 3 && this.currentTime > 0) {
                this.playSound('beep');
                if (this.voiceEnabled) this.speak(String(this.currentTime));
            }

            if (this.currentTime <= 0) {
                this.playSound('complete');
                this.speak('Exercise complete. Rest.');
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
            this.timerDisplay.classList.remove('rest-phase', 'active-phase');
            if (this.timerLabel) this.timerLabel.textContent = '// awaiting input...';
            this.sectionBadge.textContent = '⚙️  READY TO BOOT';
            this.exerciseEmoji.textContent = '🖥️';
            this.exerciseName.textContent = 'DevStretch Protocol';
            this.exerciseSubtitle.textContent = '// antiburnout system for developers';
            this.exerciseDescription.textContent = '11 exercises. ~18 minutes. Automatic timers. Voice guidance. Your body will thank you. Click START to initialize.';
            this.progressText.textContent = this.buildProgressBar(0);
            this.statCurrent.textContent = '00';
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

    completeWorkout() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.timerDisplay.classList.remove('rest-phase', 'active-phase');
        this.timerDisplay.classList.add('complete-phase');
        this.exerciseInfo.style.display = 'none';
        this.controls.style.display = 'none';

        const mins = String(Math.floor(this.totalElapsedTime / 60)).padStart(2, '0');
        const secs = String(this.totalElapsedTime % 60).padStart(2, '0');

        const completionEl = document.getElementById('completionScreen');
        document.getElementById('completionTime').textContent = `${mins}:${secs}`;
        completionEl.style.display = 'block';
        this.progressText.textContent = this.buildProgressBar(100);
        this.playSound('complete');
        this.speak('Workout complete. Excellent work, developer. Your body and your code are both in better shape now.');
        this.setStatus('COMPLETE - all exercises executed successfully');
        this.notifications.sendCustomNotification('DevStretch Complete! 🎉', `You finished all 11 exercises in ${mins}:${secs}. git push --body.`);
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        try { this.sounds[type]?.play(); } catch (e) {}
    }

    speak(text) {
        if (!this.voiceEnabled) return;
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

    async toggleNotifications() {
        if (this.notifications.isActive) {
            this.notifications.stopReminder();
            this.notifToggle.textContent = '🔔 NOTIF:OFF';
            this.notifToggle.classList.remove('toggle-on');
            this.setStatus('Stand-up reminders disabled.');
        } else {
            const mins = parseInt(this.reminderSelect.value);
            const ok = await this.notifications.startReminder(mins);
            if (ok) {
                this.notifToggle.textContent = '🔔 NOTIF:ON';
                this.notifToggle.classList.add('toggle-on');
                this.setStatus(`Stand-up reminder set: every ${mins} min`);
            } else {
                this.setStatus('ERROR: Notification permission denied.');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WorkoutTimer();
});