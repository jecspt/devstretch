// Single source of truth for the app version.
// Loaded by index.html (fills [data-app-version] elements) and by sw.js via
// importScripts (derives CACHE_NAME). Auto-bumped by .githooks/pre-commit on master.
// Must stay worker-safe: no document/window access here.
const APP_VERSION = '1.1.8';
