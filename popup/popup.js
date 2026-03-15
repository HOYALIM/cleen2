'use strict';

const SOURCE_ACTION_LABELS = {
  'park-window': 'Park Window',
  'park-inactive': 'Park Inactive',
};

const $ = (id) => document.getElementById(id);

const openCount = $('openCount');
const parkableCount = $('parkableCount');
const savedTabCount = $('savedTabCount');
const focusLabel = $('focusLabel');
const recentStacks = $('recentStacks');
const status = $('status');
const parkWindowBtn = $('parkWindowBtn');
const parkInactiveBtn = $('parkInactiveBtn');
const discardInactiveBtn = $('discardInactiveBtn');
const openLibraryBtn = $('openLibraryBtn');

async function sendMessage(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

function formatRelative(dateString) {
  const deltaMs = Date.now() - new Date(dateString).getTime();
  const deltaMin = Math.max(1, Math.floor(deltaMs / 60000));
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHours = Math.floor(deltaMin / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

function setStatus(message) {
  status.textContent = message || '';
}

function renderRecentStack(stack) {
  const card = document.createElement('article');
  card.className = 'stack-card';

  const head = document.createElement('div');
  head.className = 'stack-head';

  const badge = document.createElement('span');
  badge.className = 'stack-badge';
  badge.textContent = stack.category.label;

  const time = document.createElement('span');
  time.className = 'stack-time';
  time.textContent = formatRelative(stack.createdAt);

  head.append(badge, time);

  const title = document.createElement('h3');
  title.className = 'stack-title';
  title.textContent = stack.title;

  const meta = document.createElement('p');
  meta.className = 'stack-meta';
  meta.textContent = `${stack.stats.tabCount} tabs · ${SOURCE_ACTION_LABELS[stack.sourceAction] || 'Saved stack'}`;

  const domainRow = document.createElement('div');
  domainRow.className = 'domain-row';
  for (const domain of stack.domains.slice(0, 3)) {
    const chip = document.createElement('span');
    chip.className = 'domain-chip';
    chip.textContent = `${domain.domain} · ${domain.count}`;
    domainRow.appendChild(chip);
  }

  const actions = document.createElement('div');
  actions.className = 'stack-actions';

  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'stack-btn stack-btn--restore';
  restoreBtn.type = 'button';
  restoreBtn.textContent = 'Restore';
  restoreBtn.addEventListener('click', async () => {
    const result = await sendMessage('restoreStack', { stackId: stack.id });
    setStatus(result.success ? `Restored ${result.restoredCount} tabs.` : result.error);
    await loadOverview();
  });

  const libraryBtn = document.createElement('button');
  libraryBtn.className = 'stack-btn stack-btn--library';
  libraryBtn.type = 'button';
  libraryBtn.textContent = 'Library';
  libraryBtn.addEventListener('click', async () => {
    await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });

  actions.append(restoreBtn, libraryBtn);
  card.append(head, title, meta);
  if (domainRow.childNodes.length) {
    card.appendChild(domainRow);
  }
  card.appendChild(actions);

  return card;
}

function renderRecentStacks(items) {
  recentStacks.replaceChildren();

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'stack-empty';
    empty.textContent = 'No saved stacks yet. Park a window to start building a recoverable library.';
    recentStacks.appendChild(empty);
    return;
  }

  for (const stack of items) {
    recentStacks.appendChild(renderRecentStack(stack));
  }
}

async function loadOverview() {
  const payload = await sendMessage('getOverview');
  if (!payload.success) {
    setStatus(payload.error || 'Could not load cleen2.');
    return;
  }

  openCount.textContent = payload.overview.openCount;
  parkableCount.textContent = payload.overview.parkableCount;
  savedTabCount.textContent = payload.overview.savedTabCount;
  focusLabel.textContent = `Current window leans ${payload.overview.focusLabel}. Park ${payload.overview.parkableCount} safe tabs or discard ${payload.overview.discardableCount} inactive ones.`;
  renderRecentStacks(payload.recentStacks);
}

async function runAction(type) {
  setStatus('Working...');
  const result = await sendMessage(type);
  if (result.success) {
    if (type === 'discardInactiveTabs') {
      setStatus(`Discarded ${result.discardedCount} inactive tabs.`);
    } else if (result.parkedCount) {
      setStatus(`Saved ${result.parkedCount} tabs into a new stack.`);
    } else {
      setStatus('Action completed.');
    }
  } else {
    setStatus(result.error || 'Action failed.');
  }
  await loadOverview();
}

parkWindowBtn.addEventListener('click', async () => {
  await runAction('parkCurrentWindow');
});

parkInactiveBtn.addEventListener('click', async () => {
  await runAction('parkInactiveTabs');
});

discardInactiveBtn.addEventListener('click', async () => {
  await runAction('discardInactiveTabs');
});

openLibraryBtn.addEventListener('click', async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

loadOverview().catch((err) => {
  console.error('[cleen2] popup load failed:', err);
  setStatus('Could not load cleen2.');
});
