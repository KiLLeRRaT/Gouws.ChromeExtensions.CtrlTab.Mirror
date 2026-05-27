const HISTORY_KEY = 'tabHistory';
const MAX_HISTORY = 20;

async function initializeHistory() {
  const existing = await getHistory();
  if (existing.length > 0) return;
  try {
    const [activeTabs, allTabs] = await Promise.all([
      chrome.tabs.query({ active: true, currentWindow: true }),
      chrome.tabs.query({}),
    ]);
    const activeId = activeTabs[0]?.id;
    const sorted = [...allTabs].sort((a, b) => {
      if (a.id === activeId) return -1;
      if (b.id === activeId) return 1;
      return 0;
    });
    const history = sorted.map(tab => ({
      tabId: tab.id,
      title: tab.title || tab.url || 'New Tab',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
    })).slice(0, MAX_HISTORY);
    await setHistory(history);
  } catch (e) {
    console.error('[MRU] Failed to initialize history:', e);
  }
}

chrome.runtime.onStartup.addListener(initializeHistory);

chrome.runtime.onInstalled.addListener(async () => {
  await initializeHistory();
  // Re-inject into all already-open tabs so stale content scripts don't linger
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
  await Promise.allSettled(
    tabs.map(tab => chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }))
  );
});

async function getHistory() {
  const result = await chrome.storage.session.get(HISTORY_KEY);
  return result[HISTORY_KEY] || [];
}

async function setHistory(history) {
  await chrome.storage.session.set({ [HISTORY_KEY]: history });
}

async function upsertTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    return {
      tabId: tab.id,
      title: tab.title || tab.url || 'New Tab',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
    };
  } catch {
    return null;
  }
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tabData = await upsertTab(tabId);
  if (!tabData) return;

  let history = await getHistory();
  history = history.filter(t => t.tabId !== tabId);
  history.unshift(tabData);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  await setHistory(history);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  const tabData = await upsertTab(tabId);
  if (!tabData) return;

  let history = await getHistory();
  const idx = history.findIndex(t => t.tabId === tabId);
  if (idx !== -1) {
    history[idx] = tabData;
    await setHistory(history);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  let history = await getHistory();
  history = history.filter(t => t.tabId !== tabId);
  await setHistory(history);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'switch-mru') return;
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;
  chrome.tabs.sendMessage(activeTab.id, { action: 'commandTriggered' }).catch(async () => {
    // No content script available (page loading, new tab, etc.) — switch directly
    const history = await getHistory();
    if (history.length < 2) return;
    try {
      const tab = await chrome.tabs.get(history[1].tabId);
      await chrome.windows.update(tab.windowId, { focused: true });
      await chrome.tabs.update(history[1].tabId, { active: true });
    } catch {}
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'getMRUList') {
    getHistory().then(sendResponse);
    return true;
  }

  if (message.action === 'switchToTab') {
    const { tabId } = message;
    chrome.tabs.get(tabId)
      .then(async tab => {
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.tabs.update(tabId, { active: true });
        sendResponse({ ok: true });
      })
      .catch(async () => {
        let history = await getHistory();
        history = history.filter(t => t.tabId !== tabId);
        await setHistory(history);
        sendResponse({ ok: false });
      });
    return true;
  }
});
