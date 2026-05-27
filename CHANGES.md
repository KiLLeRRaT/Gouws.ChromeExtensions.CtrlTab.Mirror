# Changelog

## 0.1.0

Initial release.

- VS Code-style MRU tab switcher panel triggered by **Alt+`**
- Hold Alt and press ` repeatedly to cycle through recently used tabs; release Alt to switch
- Press Esc to dismiss without switching
- Tab history seeded from all open tabs on browser startup so the shortcut works immediately
- History persisted in `chrome.storage.session` across service worker restarts
