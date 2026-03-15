'use strict';

const SOURCE_ACTION_LABELS = {
  'park-window': 'Park Window',
  'park-inactive': 'Park Inactive',
};

const state = {
  stacks: [],
  overview: null,
  protectedDomains: [],
  query: '',
  favoritesOnly: false,
  highlightStackId: new URLSearchParams(window.location.search).get('stack') || '',
};

const $ = (id) => document.getElementById(id);

const openCount = $('openCount');
const parkableCount = $('parkableCount');
const protectedCount = $('protectedCount');
const stackCount = $('stackCount');
const savedTabCount = $('savedTabCount');
const searchInput = $('searchInput');
const stackGrid = $('stackGrid');
const protectedDomains = $('protectedDomains');
const protectedDomainForm = $('protectedDomainForm');
const protectedDomainInput = $('protectedDomainInput');
const protectCurrentSiteBtn = $('protectCurrentSiteBtn');
const favoritesOnlyBtn = $('favoritesOnlyBtn');
const status = $('status');
const refreshBtn = $('refreshBtn');
const parkWindowBtn = $('parkWindowBtn');
const parkInactiveBtn = $('parkInactiveBtn');
const discardInactiveBtn = $('discardInactiveBtn');

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

function matchesQuery(stack, query) {
  if (!query) {
    return true;
  }
  const haystack = [
    stack.title,
    stack.category.label,
    ...(stack.domains || []).map((domain) => domain.domain),
    ...(stack.tabs || []).map((tab) => `${tab.title} ${tab.domain}`),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function renderOverview(overview) {
  openCount.textContent = overview.openCount;
  parkableCount.textContent = overview.parkableCount;
  protectedCount.textContent = overview.protectedCount;
  stackCount.textContent = overview.stackCount;
  savedTabCount.textContent = overview.savedTabCount;
}

function renderEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = state.favoritesOnly
    ? 'No favorite stacks match this view yet. Star important stacks so they stay easy to recover.'
    : 'No saved stacks match this view yet. Park a window or inactive tabs to start building your cleen2 library.';
  stackGrid.replaceChildren(empty);
}

function renderProtectedDomains(items) {
  protectedDomains.replaceChildren();

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'chip-empty';
    empty.textContent = 'No protected domains yet.';
    protectedDomains.appendChild(empty);
    return;
  }

  for (const domain of items) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = domain;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove ${domain}`);
    removeBtn.dataset.action = 'remove-domain';
    removeBtn.dataset.domain = domain;

    chip.appendChild(removeBtn);
    protectedDomains.appendChild(chip);
  }
}

function renderFavoritesToggle() {
  favoritesOnlyBtn.classList.toggle('is-active', state.favoritesOnly);
  favoritesOnlyBtn.textContent = state.favoritesOnly ? 'Favorites Only: On' : 'Favorites Only: Off';
}

function getVisibleStacks() {
  const query = state.query.trim().toLowerCase();
  return state.stacks.filter((stack) => {
    if (state.favoritesOnly && !stack.favorite) {
      return false;
    }
    return matchesQuery(stack, query);
  });
}

function buildPreviewItem(stackId, tab) {
  const item = document.createElement('li');
  item.className = 'preview-item';

  const copy = document.createElement('div');
  copy.className = 'preview-copy';

  const title = document.createElement('p');
  title.className = 'preview-title';
  title.textContent = tab.title;

  const domain = document.createElement('p');
  domain.className = 'preview-domain';
  domain.textContent = tab.domain;

  copy.append(title, domain);

  const openBtn = document.createElement('button');
  openBtn.className = 'tab-link';
  openBtn.type = 'button';
  openBtn.textContent = 'Open';
  openBtn.dataset.action = 'open-tab';
  openBtn.dataset.stackId = stackId;
  openBtn.dataset.tabId = tab.id;

  item.append(copy, openBtn);
  return item;
}

function buildStackCard(stack) {
  const article = document.createElement('article');
  article.className = 'stack-card';
  if (stack.favorite) {
    article.classList.add('is-favorite');
  }
  if (state.highlightStackId && stack.id === state.highlightStackId) {
    article.classList.add('is-highlighted');
  }

  const head = document.createElement('div');
  head.className = 'stack-head';

  const headMain = document.createElement('div');
  headMain.className = 'stack-head-main';

  const badge = document.createElement('span');
  badge.className = 'stack-badge';
  badge.textContent = stack.category.label;
  headMain.appendChild(badge);

  if (stack.favorite) {
    const favoritePill = document.createElement('span');
    favoritePill.className = 'stack-favorite-pill';
    favoritePill.textContent = 'Favorite';
    headMain.appendChild(favoritePill);
  }

  const time = document.createElement('span');
  time.className = 'stack-time';
  time.textContent = formatRelative(stack.createdAt);

  head.append(headMain, time);

  const title = document.createElement('h2');
  title.className = 'stack-title';
  title.textContent = stack.title;

  const meta = document.createElement('p');
  meta.className = 'stack-meta';
  meta.textContent = `${stack.stats.tabCount} tabs · ${stack.stats.domainCount} domains · ${SOURCE_ACTION_LABELS[stack.sourceAction] || 'Saved stack'}`;

  const domains = document.createElement('div');
  domains.className = 'domain-row';
  for (const domain of stack.domains.slice(0, 4)) {
    const chip = document.createElement('span');
    chip.className = 'domain-chip';
    chip.textContent = `${domain.domain} · ${domain.count}`;
    domains.appendChild(chip);
  }

  const preview = document.createElement('ul');
  preview.className = 'preview-list';
  for (const tab of stack.tabs.slice(0, 5)) {
    preview.appendChild(buildPreviewItem(stack.id, tab));
  }

  const actions = document.createElement('div');
  actions.className = 'stack-actions';

  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'stack-action stack-action--restore';
  restoreBtn.type = 'button';
  restoreBtn.textContent = 'Restore All';
  restoreBtn.dataset.action = 'restore-stack';
  restoreBtn.dataset.stackId = stack.id;

  const favoriteBtn = document.createElement('button');
  favoriteBtn.className = 'stack-action stack-action--favorite';
  if (stack.favorite) {
    favoriteBtn.classList.add('is-on');
  }
  favoriteBtn.type = 'button';
  favoriteBtn.textContent = stack.favorite ? 'Unfavorite' : 'Favorite';
  favoriteBtn.dataset.action = 'toggle-favorite';
  favoriteBtn.dataset.stackId = stack.id;

  const renameBtn = document.createElement('button');
  renameBtn.className = 'stack-action stack-action--rename';
  renameBtn.type = 'button';
  renameBtn.textContent = 'Rename';
  renameBtn.dataset.action = 'rename-stack';
  renameBtn.dataset.stackId = stack.id;
  renameBtn.dataset.title = stack.title;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'stack-action stack-action--delete';
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Delete';
  deleteBtn.dataset.action = 'delete-stack';
  deleteBtn.dataset.stackId = stack.id;

  actions.append(restoreBtn, favoriteBtn, renameBtn, deleteBtn);
  article.append(head, title, meta);
  if (domains.childNodes.length) {
    article.appendChild(domains);
  }
  article.append(preview, actions);

  return article;
}

function renderStacks() {
  const filtered = getVisibleStacks();

  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  stackGrid.replaceChildren(...filtered.map((stack) => buildStackCard(stack)));

  if (state.highlightStackId) {
    const highlighted = stackGrid.querySelector('.is-highlighted');
    highlighted?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    state.highlightStackId = '';
  }
}

async function loadDashboard(statusMessage = '') {
  const payload = await sendMessage('getDashboardData');
  if (!payload.success) {
    setStatus(payload.error || 'Could not load cleen2 library.');
    return;
  }

  state.overview = payload.overview;
  state.stacks = payload.stacks;
  state.protectedDomains = payload.protectedDomains || [];
  renderOverview(payload.overview);
  renderProtectedDomains(state.protectedDomains);
  renderFavoritesToggle();
  renderStacks();
  setStatus(statusMessage || `Loaded ${payload.stacks.length} saved stacks and ${state.protectedDomains.length} protected domains.`);
}

async function runQuickAction(type) {
  setStatus('Working...');
  const result = await sendMessage(type);
  if (!result.success) {
    setStatus(result.error || 'Action failed.');
    return;
  }

  if (type === 'discardInactiveTabs') {
    setStatus(`Discarded ${result.discardedCount} inactive tabs.`);
  } else if (result.parkedCount) {
    setStatus(`Saved ${result.parkedCount} tabs into a new stack.`);
  } else if (result.protectedDomain) {
    setStatus(`Protected ${result.protectedDomain}.`);
  } else {
    setStatus('Action completed.');
  }

  await loadDashboard(
    type === 'discardInactiveTabs'
      ? `Discarded ${result.discardedCount} inactive tabs.`
      : result.parkedCount
        ? `Saved ${result.parkedCount} tabs into a new stack.`
        : result.protectedDomain
          ? `Protected ${result.protectedDomain}.`
          : 'Action completed.'
  );
}

stackGrid.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }

  const { action, stackId, tabId } = target.dataset;

  if (action === 'restore-stack') {
    const result = await sendMessage('restoreStack', { stackId });
    if (!result.success) {
      setStatus(result.error);
      return;
    }
    await loadDashboard(`Restored ${result.restoredCount} tabs.`);
    return;
  }

  if (action === 'delete-stack') {
    const result = await sendMessage('deleteStack', { stackId });
    if (!result.success) {
      setStatus(result.error);
      return;
    }
    await loadDashboard('Deleted saved stack.');
    return;
  }

  if (action === 'toggle-favorite') {
    const result = await sendMessage('toggleFavorite', { stackId });
    if (!result.success) {
      setStatus(result.error);
      return;
    }
    await loadDashboard(`${result.favorite ? 'Favorited' : 'Unfavorited'} stack.`);
    return;
  }

  if (action === 'rename-stack') {
    const nextTitle = window.prompt('Rename stack', target.dataset.title || '');
    if (nextTitle == null) {
      return;
    }
    const result = await sendMessage('renameStack', { stackId, title: nextTitle });
    if (!result.success) {
      setStatus(result.error);
      return;
    }
    await loadDashboard('Renamed stack.');
    return;
  }

  if (action === 'open-tab') {
    const result = await sendMessage('openSavedTab', { stackId, tabId });
    setStatus(result.success ? 'Opened saved tab.' : result.error);
  }
});

protectedDomains.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action="remove-domain"]');
  if (!target) {
    return;
  }
  const result = await sendMessage('removeProtectedDomain', { domain: target.dataset.domain });
  if (!result.success) {
    setStatus(result.error);
    return;
  }
  await loadDashboard(`Removed ${target.dataset.domain} from protected sites.`);
});

protectedDomainForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const domain = protectedDomainInput.value.trim();
  if (!domain) {
    protectedDomainInput.focus();
    return;
  }
  const result = await sendMessage('addProtectedDomain', { domain });
  if (result.success) {
    protectedDomainInput.value = '';
  }
  if (!result.success) {
    setStatus(result.error);
    return;
  }
  await loadDashboard(`Protected ${result.protectedDomain}.`);
});

protectCurrentSiteBtn.addEventListener('click', async () => {
  await runQuickAction('protectCurrentSite');
});

searchInput.addEventListener('input', () => {
  state.query = searchInput.value;
  renderStacks();
});

favoritesOnlyBtn.addEventListener('click', () => {
  state.favoritesOnly = !state.favoritesOnly;
  renderFavoritesToggle();
  renderStacks();
});

refreshBtn.addEventListener('click', async () => {
  await loadDashboard();
});

parkWindowBtn.addEventListener('click', async () => {
  await runQuickAction('parkCurrentWindow');
});

parkInactiveBtn.addEventListener('click', async () => {
  await runQuickAction('parkInactiveTabs');
});

discardInactiveBtn.addEventListener('click', async () => {
  await runQuickAction('discardInactiveTabs');
});

loadDashboard().catch((err) => {
  console.error('[cleen2] dashboard load failed:', err);
  setStatus('Could not load cleen2 library.');
});
