// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('DevStretch Plus: SW registered on scope:', reg.scope);
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New content available; please refresh.');
                        }
                    };
                };
            })
            .catch(err => console.warn('DevStretch Plus: SW failed:', err));
    });
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'flex';
        
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
});

window.addEventListener('appinstalled', () => {
    console.log('DevStretch Plus: Installation confirmed.');
    deferredPrompt = null;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.style.display = 'none';
});