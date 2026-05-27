# CtrlTab — MRU Tab Switcher

A Chrome/Brave extension that brings Visual Studio's **most-recently-used tab switching** to the browser.

Chrome's built-in Ctrl+Tab cycles through tabs in order. This extension instead tracks which tabs you've actually used and lets you jump between them in MRU order — the same muscle memory as Alt+Tab for windows, or Ctrl+Tab in Visual Studio/VS Code.

## Shortcut

**Alt+`** (Alt + backtick)

> Chrome reserves Ctrl+Tab at the browser level so it cannot be overridden by extensions.
> You can remap the shortcut at `chrome://extensions/shortcuts`.

## How it works

| Action | Result |
|---|---|
| Press **Alt+`** | Panel opens, previous tab highlighted |
| Hold Alt, press **`** again | Selection moves to next tab in MRU order |
| Release **Alt** | Switches to the selected tab |
| Press **Esc** | Dismisses the panel without switching |

The panel lists your recently used tabs in order, with favicons and hostnames:

```
┌──────────────────────────────────────┐
│  RECENTLY USED TABS (ALT+`)          │
├──────────────────────────────────────┤
│   ● github.com — Pull Request #42    │
│ ▶ ● gmail.com — Inbox                │  ← selected
│   ● localhost:3000 — App             │
│   ● stackoverflow.com — ...          │
└──────────────────────────────────────┘
  ` cycle · release Alt to switch · Esc to cancel
```

## Installation

This extension is not published to the Chrome Web Store. Install it as an unpacked extension:

1. Clone or download this repository
2. Open `chrome://extensions` (or `brave://extensions`)
3. Enable **Developer mode** (toggle in the top-right)
4. Click **Load unpacked** and select the `src/` folder

After any code update, click the reload button (↺) on the extension card — open tabs are updated automatically, no page refreshes needed.

## Compatibility

- Chrome 102+
- Brave (Chromium-based)
- Works on all `http://` and `https://` pages including Gmail and GitHub
- Does **not** work on `chrome://` internal pages (browser restriction)

## Project structure

```
src/
  manifest.json   — Extension manifest (Manifest V3)
  background.js   — Service worker: tracks MRU tab history, handles tab switching
  content.js      — Injected into pages: renders the switcher panel, handles keyboard input
CHANGES.md        — Version history
```
