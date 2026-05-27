# Changelog

## 0.2.0

- Shortcut changed from Alt+` to **Alt+Q** (backtick is not supported by the `chrome.commands` API)
- Shortcut now works while a page is loading or on the new tab page via `chrome.commands`; falls back to a direct tab switch when no panel is available
- Fixed race condition where the direct-switch fallback triggered even on normal loaded pages
- Panel and toast now render safely during very early page load before `document.body` exists

## 0.1.1

- Shortcut now works inside Gmail's iframes (`all_frames: true`)
- Extension re-injects itself into open tabs on reload — no manual tab refresh needed
- Stale content script errors after dev reloads are now suppressed silently

## 0.1.0

Initial release.

- VS Code-style MRU tab switcher panel triggered by **Alt+Q**
- Hold Alt and press Q repeatedly to cycle through recently used tabs; release Alt to switch
- Press Esc to dismiss without switching
- Tab history seeded from all open tabs on browser startup so the shortcut works immediately
- History persisted in `chrome.storage.session` across service worker restarts
