// auto-bumped by .githooks/pre-commit — must change bytes so the browser detects SW updates
const APP_VERSION = '1.1.12';
const CACHE_NAME = `devstretch-plus-v${APP_VERSION}`;
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/version.js',
    '/exercises.js',
    '/notifications.js',
    '/script.js',
    '/pwa.js',
    '/manifest.json',
    '/sounds/beep-07a.wav',
    '/sounds/beep-01a.wav',
    '/sounds/pause.wav',
    '/sounds/button-2.wav',
    '/sounds/button-3.wav'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
