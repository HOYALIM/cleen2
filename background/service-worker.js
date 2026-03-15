'use strict';

const STORAGE_KEYS = {
  stacks: 'cleen2.stacks',
  activity: 'cleen2.activity',
  protectedDomains: 'cleen2.protectedDomains',
};

const MAX_STACKS = 100;
const MAX_ACTIVITY_ENTRIES = 1500;

const FALLBACK_CATEGORY = {
  id: 'general',
  label: 'General',
  tone: 'slate',
};

const CATEGORY_RULES = [
  {
    id: 'ai',
    label: 'AI',
    tone: 'amber',
    domains: ['chatgpt.com', 'chat.openai.com', 'claude.ai', 'gemini.google.com', 'perplexity.ai', 'poe.com'],
    keywords: ['chatgpt', 'claude', 'gemini', 'perplexity', 'assistant', 'llm'],
  },
  {
    id: 'mail',
    label: 'Mail',
    tone: 'sky',
    domains: ['mail.google.com', 'outlook.office.com', 'outlook.live.com', 'proton.me', 'hey.com'],
    keywords: ['mail', 'inbox', 'gmail', 'outlook'],
  },
  {
    id: 'docs',
    label: 'Docs',
    tone: 'violet',
    domains: ['docs.google.com', 'drive.google.com', 'notion.so', 'coda.io', 'slite.com'],
    keywords: ['document', 'docs', 'spreadsheet', 'slides', 'workspace', 'wiki'],
  },
  {
    id: 'dev',
    label: 'Dev',
    tone: 'emerald',
    domains: ['github.com', 'gitlab.com', 'vercel.com', 'netlify.com', 'npmjs.com', 'stackoverflow.com'],
    keywords: ['pull request', 'commit', 'deploy', 'localhost', 'api', 'developer'],
  },
  {
    id: 'design',
    label: 'Design',
    tone: 'rose',
    domains: ['figma.com', 'canva.com', 'miro.com', 'framer.com', 'dribbble.com'],
    keywords: ['design', 'prototype', 'brand', 'board'],
  },
  {
    id: 'video',
    label: 'Video',
    tone: 'red',
    domains: ['youtube.com', 'youtu.be', 'vimeo.com', 'netflix.com', 'twitch.tv'],
    keywords: ['video', 'watch', 'stream', 'playlist'],
  },
  {
    id: 'research',
    label: 'Research',
    tone: 'cyan',
    domains: ['wikipedia.org', 'arxiv.org', 'scholar.google.com', 'medium.com', 'substack.com'],
    keywords: ['research', 'paper', 'article', 'read'],
  },
  {
    id: 'social',
    label: 'Social',
    tone: 'pink',
    domains: ['x.com', 'twitter.com', 'linkedin.com', 'reddit.com', 'facebook.com', 'instagram.com'],
    keywords: ['feed', 'post', 'thread'],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    tone: 'yellow',
    domains: ['amazon.com', 'etsy.com', 'ebay.com', 'shopify.com'],
    keywords: ['buy', 'cart', 'checkout', 'shop'],
  },
  {
    id: 'finance',
    label: 'Finance',
    tone: 'lime',
    domains: ['stripe.com', 'paypal.com', 'coinbase.com', 'chase.com', 'bankofamerica.com'],
    keywords: ['billing', 'invoice', 'bank', 'finance'],
  },
];

let activityMap = new Map();
let persistActivityTimer = 0;

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `stack-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
}

async function storageGet(key, fallbackValue) {
  try {
    const data = await chrome.storage.local.get(key);
    return data[key] ?? fallbackValue;
  } catch (err) {
    console.error('[cleen2] storageGet failed:', key, err);
    return fallbackValue;
  }
}

async function storageSet(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (err) {
    console.error('[cleen2] storageSet failed:', key, err);
  }
}

function canManageUrl(url) {
  return typeof url === 'string' && /^https?:/i.test(url);
}

function normalizeDomain(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return '';
  }
  try {
    const parsed = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getDomain(url) {
  return normalizeDomain(url) || 'internal';
}

async function getStacks() {
  const stacks = await storageGet(STORAGE_KEYS.stacks, []);
  return Array.isArray(stacks) ? stacks : [];
}

async function setStacks(stacks) {
  await storageSet(STORAGE_KEYS.stacks, stacks.slice(0, MAX_STACKS));
}

async function getProtectedDomains() {
  const domains = await storageGet(STORAGE_KEYS.protectedDomains, []);
  return Array.isArray(domains)
    ? domains.map((entry) => normalizeDomain(entry)).filter(Boolean).sort()
    : [];
}

async function setProtectedDomains(domains) {
  const uniqueDomains = Array.from(new Set(domains.map((entry) => normalizeDomain(entry)).filter(Boolean))).sort();
  await storageSet(STORAGE_KEYS.protectedDomains, uniqueDomains);
  return uniqueDomains;
}

function sortStacksForDisplay(stacks) {
  return [...stacks].sort((a, b) => {
    if (Boolean(a.favorite) !== Boolean(b.favorite)) {
      return a.favorite ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function touchTab(tabId, timestamp = Date.now()) {
  if (!tabId) {
    return;
  }
  activityMap.set(tabId, timestamp);
  schedulePersistActivity();
}

function schedulePersistActivity() {
  clearTimeout(persistActivityTimer);
  persistActivityTimer = setTimeout(() => {
    persistActivityMap().catch((err) => console.error('[cleen2] persistActivityMap failed:', err));
  }, 300);
}

async function persistActivityMap() {
  if (activityMap.size > MAX_ACTIVITY_ENTRIES) {
    const trimmed = [...activityMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ACTIVITY_ENTRIES);
    activityMap = new Map(trimmed);
  }
  await storageSet(STORAGE_KEYS.activity, Object.fromEntries(activityMap));
}

async function loadActivityMap() {
  const saved = await storageGet(STORAGE_KEYS.activity, {});
  if (!saved || typeof saved !== 'object') {
    activityMap = new Map();
    return;
  }
  activityMap = new Map(
    Object.entries(saved).map(([tabId, timestamp]) => [Number(tabId), Number(timestamp)])
  );
}

async function seedActivityMap() {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  let changed = false;
  for (const tab of tabs) {
    if (tab.id && !activityMap.has(tab.id)) {
      activityMap.set(tab.id, now);
      changed = true;
    }
  }
  if (changed) {
    schedulePersistActivity();
  }
}

function isProtectedTab(tab, protectedSet) {
  return protectedSet.has(getDomain(tab.url));
}

function isParkableTab(tab, includeActive, protectedSet) {
  return Boolean(
    tab &&
      tab.id &&
      canManageUrl(tab.url) &&
      !tab.pinned &&
      !tab.audible &&
      !isProtectedTab(tab, protectedSet) &&
      (includeActive || !tab.active)
  );
}

function isDiscardableTab(tab, protectedSet) {
  return Boolean(
    tab &&
      tab.id &&
      canManageUrl(tab.url) &&
      !tab.active &&
      !tab.pinned &&
      !tab.audible &&
      !tab.discarded &&
      !isProtectedTab(tab, protectedSet)
  );
}

function classifyTab(tab) {
  const domain = getDomain(tab.url);
  const haystack = `${tab.title || ''} ${tab.url || ''}`.toLowerCase();
  let bestRule = FALLBACK_CATEGORY;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    for (const candidate of rule.domains) {
      if (domain === candidate || domain.endsWith(`.${candidate}`)) {
        score += 4;
      }
    }

    for (const keyword of rule.keywords) {
      if (haystack.includes(keyword)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestRule = rule;
      bestScore = score;
    }
  }

  return {
    id: bestRule.id,
    label: bestRule.label,
    tone: bestRule.tone,
  };
}

function summarizeDominantCategory(items) {
  const counts = new Map();

  for (const item of items) {
    const key = item.category.id;
    const entry = counts.get(key) || { category: item.category, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }

  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.category || FALLBACK_CATEGORY;
}

function getTopDomains(items, limit = 4) {
  const counts = new Map();

  for (const item of items) {
    if (!item.domain || item.domain === 'internal') {
      continue;
    }
    counts.set(item.domain, (counts.get(item.domain) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([domain, count]) => ({ domain, count }));
}

function buildStackTitle(tabs, category, domains) {
  if (tabs.length === 1) {
    return tabs[0].title || tabs[0].domain || `${category.label} tab`;
  }
  if (domains[0]?.domain) {
    return `${category.label} · ${domains[0].domain}`;
  }
  return `${category.label} · ${tabs.length} tabs`;
}

function buildStoredTab(tab, sourceAction) {
  return {
    id: createId(),
    title: tab.title || 'Untitled',
    url: tab.url,
    domain: getDomain(tab.url),
    favIconUrl: tab.favIconUrl || '',
    category: classifyTab(tab),
    lastTouchedAt: activityMap.get(tab.id) || Date.now(),
    savedAt: new Date().toISOString(),
    sourceAction,
  };
}

function buildStack(tabs, sourceAction) {
  const storedTabs = tabs.map((tab) => buildStoredTab(tab, sourceAction));
  const category = summarizeDominantCategory(storedTabs);
  const domains = getTopDomains(storedTabs);
  const domainCount = new Set(storedTabs.map((tab) => tab.domain).filter((domain) => domain !== 'internal')).size;

  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    sourceAction,
    favorite: false,
    title: buildStackTitle(storedTabs, category, domains),
    category,
    domains,
    stats: {
      tabCount: storedTabs.length,
      domainCount,
    },
    tabs: storedTabs,
  };
}

function serializeStackPreview(stack, previewLimit = 3) {
  return {
    id: stack.id,
    createdAt: stack.createdAt,
    sourceAction: stack.sourceAction,
    favorite: Boolean(stack.favorite),
    title: stack.title,
    category: stack.category,
    domains: stack.domains,
    stats: stack.stats,
    tabs: stack.tabs.slice(0, previewLimit),
  };
}

function getWindowFocusLabel(tabs) {
  if (!tabs.length) {
    return 'Mixed';
  }
  const classified = tabs.map((tab) => ({ category: classifyTab(tab) }));
  return summarizeDominantCategory(classified).label;
}

async function prependStack(stack) {
  const stacks = await getStacks();
  stacks.unshift(stack);
  await setStacks(stacks);
}

async function openDashboardTab(stackId = '') {
  const query = stackId ? `?stack=${encodeURIComponent(stackId)}` : '';
  const url = chrome.runtime.getURL(`dashboard/dashboard.html${query}`);
  await chrome.tabs.create({ url, active: true });
}

async function parkTabs({ includeActive, sourceAction, openLibrary }) {
  const currentTabs = await chrome.tabs.query({ currentWindow: true });
  const protectedSet = new Set(await getProtectedDomains());
  const parkableTabs = currentTabs.filter((tab) => isParkableTab(tab, includeActive, protectedSet));

  if (!parkableTabs.length) {
    return { success: false, error: 'No safe tabs to park in this window.' };
  }

  const stack = buildStack(parkableTabs, sourceAction);
  await prependStack(stack);

  if (openLibrary) {
    await openDashboardTab(stack.id);
  }

  await chrome.tabs.remove(parkableTabs.map((tab) => tab.id).filter(Boolean));

  return {
    success: true,
    parkedCount: parkableTabs.length,
    stack: serializeStackPreview(stack),
  };
}

async function discardInactiveTabs() {
  const currentTabs = await chrome.tabs.query({ currentWindow: true });
  const protectedSet = new Set(await getProtectedDomains());
  const discardableTabs = currentTabs.filter((tab) => isDiscardableTab(tab, protectedSet));

  if (!discardableTabs.length) {
    return { success: false, error: 'No safe tabs to discard in this window.' };
  }

  let discardedCount = 0;

  for (const tab of discardableTabs) {
    try {
      await chrome.tabs.discard(tab.id);
      discardedCount += 1;
    } catch (err) {
      console.debug('[cleen2] Could not discard tab:', tab.id, err);
    }
  }

  if (!discardedCount) {
    return { success: false, error: 'Chrome refused to discard the selected tabs.' };
  }

  return {
    success: true,
    discardedCount,
  };
}

async function restoreStack(stackId) {
  const stacks = await getStacks();
  const stackIndex = stacks.findIndex((stack) => stack.id === stackId);

  if (stackIndex < 0) {
    return { success: false, error: 'Saved stack not found.' };
  }

  const stack = stacks[stackIndex];
  const urls = stack.tabs.map((tab) => tab.url).filter(canManageUrl);

  if (!urls.length) {
    return { success: false, error: 'This stack does not contain restorable web tabs.' };
  }

  const currentTabs = await chrome.tabs.query({ currentWindow: true, active: true });
  const currentTab = currentTabs[0];
  const baseWindowId = currentTab?.windowId;
  let nextIndex = currentTab?.index != null ? currentTab.index + 1 : undefined;
  let firstTab = true;
  let restoredCount = 0;

  for (const url of urls) {
    const createOptions = {
      url,
      active: firstTab,
    };

    if (baseWindowId != null) {
      createOptions.windowId = baseWindowId;
    }

    if (nextIndex != null) {
      createOptions.index = nextIndex;
      nextIndex += 1;
    }

    await chrome.tabs.create(createOptions);
    firstTab = false;
    restoredCount += 1;
  }

  stacks.splice(stackIndex, 1);
  await setStacks(stacks);

  return {
    success: true,
    restoredCount,
  };
}

async function openSavedTab(stackId, tabId) {
  const stacks = await getStacks();
  const stack = stacks.find((entry) => entry.id === stackId);

  if (!stack) {
    return { success: false, error: 'Saved stack not found.' };
  }

  const targetTab = stack.tabs.find((entry) => entry.id === tabId);

  if (!targetTab || !canManageUrl(targetTab.url)) {
    return { success: false, error: 'Saved tab not found.' };
  }

  const currentTabs = await chrome.tabs.query({ currentWindow: true, active: true });
  const currentTab = currentTabs[0];
  const createOptions = {
    url: targetTab.url,
    active: true,
  };

  if (currentTab?.windowId != null) {
    createOptions.windowId = currentTab.windowId;
  }

  await chrome.tabs.create(createOptions);

  return { success: true };
}

async function deleteStack(stackId) {
  const stacks = await getStacks();
  const nextStacks = stacks.filter((stack) => stack.id !== stackId);

  if (nextStacks.length === stacks.length) {
    return { success: false, error: 'Saved stack not found.' };
  }

  await setStacks(nextStacks);
  return { success: true };
}

async function renameStack(stackId, nextTitle) {
  const title = String(nextTitle || '').trim();
  if (!title) {
    return { success: false, error: 'Title cannot be empty.' };
  }

  const stacks = await getStacks();
  const stack = stacks.find((entry) => entry.id === stackId);

  if (!stack) {
    return { success: false, error: 'Saved stack not found.' };
  }

  stack.title = title.slice(0, 120);
  await setStacks(stacks);
  return { success: true };
}

async function toggleFavorite(stackId) {
  const stacks = await getStacks();
  const stack = stacks.find((entry) => entry.id === stackId);

  if (!stack) {
    return { success: false, error: 'Saved stack not found.' };
  }

  stack.favorite = !stack.favorite;
  await setStacks(stacks);
  return { success: true, favorite: stack.favorite };
}

async function addProtectedDomain(rawDomain) {
  const domain = normalizeDomain(rawDomain);
  if (!domain) {
    return { success: false, error: 'Enter a valid hostname.' };
  }

  const nextDomains = await setProtectedDomains([...(await getProtectedDomains()), domain]);
  return { success: true, protectedDomains: nextDomains, protectedDomain: domain };
}

async function removeProtectedDomain(rawDomain) {
  const domain = normalizeDomain(rawDomain);
  const currentDomains = await getProtectedDomains();
  const nextDomains = currentDomains.filter((entry) => entry !== domain);

  if (nextDomains.length === currentDomains.length) {
    return { success: false, error: 'Protected domain not found.' };
  }

  await setProtectedDomains(nextDomains);
  return { success: true, protectedDomains: nextDomains };
}

async function protectCurrentSite() {
  const activeTabs = await chrome.tabs.query({ currentWindow: true, active: true });
  const activeTab = activeTabs[0];
  const domain = getDomain(activeTab?.url);

  if (!activeTab || domain === 'internal') {
    return { success: false, error: 'Current tab is not a protectable web page.' };
  }

  return addProtectedDomain(domain);
}

async function getOverview() {
  const currentTabs = await chrome.tabs.query({ currentWindow: true });
  const webTabs = currentTabs.filter((tab) => canManageUrl(tab.url));
  const protectedDomains = await getProtectedDomains();
  const protectedSet = new Set(protectedDomains);
  const stacks = sortStacksForDisplay(await getStacks());

  return {
    success: true,
    overview: {
      openCount: webTabs.length,
      parkableCount: currentTabs.filter((tab) => isParkableTab(tab, true, protectedSet)).length,
      discardableCount: currentTabs.filter((tab) => isDiscardableTab(tab, protectedSet)).length,
      protectedCount: protectedDomains.length,
      stackCount: stacks.length,
      savedTabCount: stacks.reduce((sum, stack) => sum + (stack.stats?.tabCount || 0), 0),
      focusLabel: getWindowFocusLabel(webTabs),
    },
    protectedDomains,
    recentStacks: stacks.slice(0, 3).map((stack) => serializeStackPreview(stack)),
  };
}

async function getDashboardData() {
  const overviewPayload = await getOverview();
  const stacks = sortStacksForDisplay(await getStacks());

  return {
    success: true,
    overview: overviewPayload.overview,
    protectedDomains: overviewPayload.protectedDomains,
    stacks,
  };
}

async function initialize() {
  await loadActivityMap();
  await seedActivityMap();
}

chrome.runtime.onInstalled.addListener(() => {
  initialize().catch((err) => console.error('[cleen2] initialize failed on install:', err));
});

chrome.runtime.onStartup.addListener(() => {
  initialize().catch((err) => console.error('[cleen2] initialize failed on startup:', err));
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  touchTab(tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
  touchTab(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    touchTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activityMap.delete(tabId);
  schedulePersistActivity();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const respond = (promise) => {
    promise.then(sendResponse).catch((err) => {
      console.error('[cleen2] message handler failed:', message?.type, err);
      sendResponse({ success: false, error: 'Unexpected error.' });
    });
    return true;
  };

  switch (message?.type) {
    case 'getOverview':
      return respond(getOverview());
    case 'getDashboardData':
      return respond(getDashboardData());
    case 'parkCurrentWindow':
      return respond(parkTabs({ includeActive: true, sourceAction: 'park-window', openLibrary: true }));
    case 'parkInactiveTabs':
      return respond(parkTabs({ includeActive: false, sourceAction: 'park-inactive', openLibrary: false }));
    case 'discardInactiveTabs':
      return respond(discardInactiveTabs());
    case 'restoreStack':
      return respond(restoreStack(message.stackId));
    case 'openSavedTab':
      return respond(openSavedTab(message.stackId, message.tabId));
    case 'deleteStack':
      return respond(deleteStack(message.stackId));
    case 'renameStack':
      return respond(renameStack(message.stackId, message.title));
    case 'toggleFavorite':
      return respond(toggleFavorite(message.stackId));
    case 'protectCurrentSite':
      return respond(protectCurrentSite());
    case 'addProtectedDomain':
      return respond(addProtectedDomain(message.domain));
    case 'removeProtectedDomain':
      return respond(removeProtectedDomain(message.domain));
    case 'openDashboard':
      return respond(openDashboardTab(message.stackId).then(() => ({ success: true })));
    default:
      return false;
  }
});

initialize().catch((err) => console.error('[cleen2] initialize failed:', err));
