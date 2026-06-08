class NotificationManager {
    constructor() {
        this.reminderInterval = null;
        this.intervalMinutes = 45;
        this.isActive = false;
        this.permission = Notification.permission;
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('DevStretch: Notifications not supported.');
            return false;
        }
        if (this.permission === 'granted') return true;
        if (this.permission === 'denied') return false;

        const result = await Notification.requestPermission();
        this.permission = result;
        return result === 'granted';
    }

    async startReminder(minutes = 45) {
        const granted = await this.requestPermission();
        if (!granted) return false;

        this.stopReminder();
        this.intervalMinutes = minutes;
        this.isActive = true;

        this.reminderInterval = setInterval(() => {
            this.sendStandUpNotification();
        }, minutes * 60 * 1000);

        return true;
    }

    stopReminder() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }
        this.isActive = false;
    }

    async showViaServiceWorker(title, body, tag = 'devstretch-reminder') {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(title, {
                body,
                icon: 'icons/icon-192x192.png',
                badge: 'icons/icon-96x96.png',
                tag,
                renotify: true,
                requireInteraction: false
            });
            return true;
        }
        return false;
    }

    async sendStandUpNotification() {
        const messages = [
            { title: "Stand up, dev! 🚀", body: `You've been coding for ${this.intervalMinutes} minutes. Time to Deploy to Standing Position.` },
            { title: "git push --yourself 💪", body: "Time for a DevStretch break. Your body filed a bug report." },
            { title: "⚠️ MEMORY LEAK DETECTED", body: "You've been sitting too long. Run garbage collection now." },
            { title: "Linter Warning: Posture 🦴", body: `${this.intervalMinutes}min break reminder. Open DevStretch and fix those warnings.` },
            { title: "Scheduled maintenance 🔧", body: "Time to take your system offline for a quick stretch. // It's a feature, not a bug" },
        ];

        const msg = messages[Math.floor(Math.random() * messages.length)];

        const swUsed = await this.showViaServiceWorker(msg.title, msg.body, 'devstretch-reminder');
        if (!swUsed) {
            try {
                new Notification(msg.title, {
                    body: msg.body,
                    icon: 'icons/icon-192x192.png',
                    tag: 'devstretch-reminder',
                    renotify: true
                });
            } catch (e) {
                console.warn('DevStretch notification error:', e);
            }
        }
    }

    async sendCustomNotification(title, body) {
        if (this.permission !== 'granted') return;
        const swUsed = await this.showViaServiceWorker(title, body, 'devstretch-custom');
        if (!swUsed) {
            try {
                new Notification(title, {
                    body,
                    icon: 'icons/icon-192x192.png',
                    tag: 'devstretch-custom'
                });
            } catch (e) {
                console.warn('DevStretch notification error:', e);
            }
        }
    }
}

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