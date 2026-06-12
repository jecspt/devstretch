// Single source of truth for the app version displayed in the UI.
// Loaded by index.html (fills [data-app-version] elements).
// sw.js has its own copy (auto-bumped in sync) so its bytes change and the browser
// detects service worker updates. Auto-bumped by .githooks/pre-commit on master.
const APP_VERSION = '1.1.17';
