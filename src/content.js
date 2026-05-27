(() => {
  let panelEl = null;
  let listEl = null;
  let mruList = [];
  let selectedIndex = 1;

  function hostname(url) {
    try { return new URL(url).hostname || url; } catch { return url; }
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  }

  function injectStyles() {
    if (document.getElementById('__mru_tab_styles')) return;
    const style = document.createElement('style');
    style.id = '__mru_tab_styles';
    style.textContent = `
      #__mru_tab_panel * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      #__mru_tab_panel {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        z-index: 2147483647;
        background: rgba(28, 28, 28, 0.97);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        min-width: 420px; max-width: 600px;
        color: #d4d4d4;
        overflow: hidden;
      }
      #__mru_tab_panel .header {
        padding: 10px 14px 8px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #888;
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }
      #__mru_tab_panel .list {
        max-height: 340px;
        overflow-y: auto;
        padding: 4px 0;
      }
      #__mru_tab_panel .list::-webkit-scrollbar { width: 4px; }
      #__mru_tab_panel .list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      #__mru_tab_panel .item {
        display: flex; align-items: center; gap: 10px;
        padding: 7px 14px;
        cursor: default;
        border-left: 3px solid transparent;
        transition: background 0.05s;
      }
      #__mru_tab_panel .item.selected {
        background: rgba(255,255,255,0.08);
        border-left-color: #007acc;
      }
      #__mru_tab_panel .item img { width: 16px; height: 16px; flex-shrink: 0; }
      #__mru_tab_panel .item .favicon-placeholder {
        width: 16px; height: 16px; flex-shrink: 0;
        background: rgba(255,255,255,0.15); border-radius: 2px;
      }
      #__mru_tab_panel .item .text { overflow: hidden; }
      #__mru_tab_panel .item .title { font-size: 13px; color: #e0e0e0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #__mru_tab_panel .item .url { font-size: 11px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #__mru_tab_panel .footer {
        padding: 7px 14px;
        font-size: 11px; color: #555;
        border-top: 1px solid rgba(255,255,255,0.07);
      }
    `;
    document.head.appendChild(style);
  }

  function buildPanel() {
    injectStyles();

    if (!panelEl) {
      panelEl = document.createElement('div');
      panelEl.id = '__mru_tab_panel';

      const header = document.createElement('div');
      header.className = 'header';
      header.textContent = 'Recently Used Tabs (Alt+`)';

      listEl = document.createElement('div');
      listEl.className = 'list';

      const footer = document.createElement('div');
      footer.className = 'footer';
      footer.textContent = '` cycle · release Alt to switch · Esc to cancel';

      panelEl.appendChild(header);
      panelEl.appendChild(listEl);
      panelEl.appendChild(footer);
      document.body.appendChild(panelEl);
    }

    renderList();
    panelEl.style.display = 'block';
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';
    mruList.forEach((tab, i) => {
      const item = document.createElement('div');
      item.className = 'item' + (i === selectedIndex ? ' selected' : '');

      if (tab.favIconUrl) {
        const img = document.createElement('img');
        img.src = tab.favIconUrl;
        img.onerror = () => img.replaceWith(placeholder());
        item.appendChild(img);
      } else {
        item.appendChild(placeholder());
      }

      const text = document.createElement('div');
      text.className = 'text';

      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = truncate(tab.title || 'New Tab', 60);

      const url = document.createElement('div');
      url.className = 'url';
      url.textContent = hostname(tab.url);

      text.appendChild(title);
      text.appendChild(url);
      item.appendChild(text);
      listEl.appendChild(item);
    });

    scrollSelectedIntoView();
  }

  function placeholder() {
    const d = document.createElement('div');
    d.className = 'favicon-placeholder';
    return d;
  }

  function scrollSelectedIntoView() {
    if (!listEl) return;
    const items = listEl.querySelectorAll('.item');
    if (items[selectedIndex]) items[selectedIndex].scrollIntoView({ block: 'nearest' });
  }

  function closePanel() {
    if (panelEl) panelEl.style.display = 'none';
    mruList = [];
    selectedIndex = 1;
  }

  function isPanelVisible() {
    return panelEl && panelEl.style.display !== 'none';
  }

  document.addEventListener('keydown', async (e) => {
    if (e.altKey && e.code === 'Backquote') {
      e.preventDefault();
      e.stopPropagation();

      if (!isPanelVisible()) {
        const list = await chrome.runtime.sendMessage({ action: 'getMRUList' });
        if (!list || list.length < 2) return;
        mruList = list;
        selectedIndex = 1;
        buildPanel();
      } else {
        if (mruList.length < 2) return;
        selectedIndex = selectedIndex >= mruList.length - 1 ? 1 : selectedIndex + 1;
        renderList();
      }
      return;
    }

    if (e.code === 'Escape' && isPanelVisible()) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    }
  }, true);

  document.addEventListener('keyup', async (e) => {
    if (e.key === 'Alt' && isPanelVisible()) {
      const tab = mruList[selectedIndex];
      closePanel();
      if (tab) await chrome.runtime.sendMessage({ action: 'switchToTab', tabId: tab.tabId });
    }
  }, true);
})();
