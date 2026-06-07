const data = window.PHRASE_DATA;

if (!data) {
  throw new Error('PHRASE_DATA is missing. Load data.js before app.js.');
}

const state = {
  query: '',
  file: 'all',
};

const speech = {
  enabled: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  voice: null,
};

const els = {
  stats: document.getElementById('stats'),
  categories: document.getElementById('categories'),
  showAll: document.getElementById('showAll'),
  search: document.getElementById('search'),
  clearSearch: document.getElementById('clearSearch'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  heroCard: document.getElementById('heroCard'),
  activeFilter: document.getElementById('activeFilter'),
  matchInfo: document.getElementById('matchInfo'),
  mainView: document.getElementById('mainView'),
};

const files = data.files.map((file) => ({
  ...file,
  overview: file.sections.flatMap((section) => section.items).slice(0, 3),
}));

const allItems = files.flatMap((file) =>
  file.sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      fileLabel: file.label,
      fileName: file.file,
      fileSectionCount: file.sectionCount,
      sectionTitle: section.title,
      sectionLabel: section.label,
      sectionIndex: section.index,
    })),
  ),
);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSpeechRate(text) {
  if (!text) return 0.95;
  const hasPunctuation = /[,.!?;:]/.test(text);
  return hasPunctuation ? 0.92 : 0.98;
}

function speak(text) {
  if (!speech.enabled || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = getSpeechRate(text);
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => /en[-_]?US/i.test(voice.lang) || /English/i.test(voice.name));
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

function renderStats() {
  els.stats.innerHTML = [
    ['文件', data.stats.fileCount],
    ['分组', data.stats.sectionCount],
    ['条目', data.stats.itemCount],
    ['当前', state.file === 'all' ? '全部' : 1],
  ]
    .map(
      ([label, value]) => `
        <div class="stat">
          <strong>${value}</strong>
          <span class="muted">${label}</span>
        </div>`,
    )
    .join('');
}

function renderCategories() {
  els.categories.innerHTML = files
    .map((file) => {
      const active = state.file === file.file ? 'active' : '';
      const preview = file.overview
        .map((item) => item.term)
        .slice(0, 2)
        .join(' · ');
      return `
        <button class="category-card ${active}" data-file="${escapeHtml(file.file)}" type="button">
          <div class="title">${escapeHtml(file.label)}</div>
          <div class="meta">${file.sectionCount} 个分组 · ${file.itemCount} 条</div>
          <div class="meta">${escapeHtml(preview || '点击查看内容')}</div>
        </button>
      `;
    })
    .join('');

  els.categories.querySelectorAll('[data-file]').forEach((button) => {
    button.addEventListener('click', () => {
      state.file = button.dataset.file;
      render();
    });
  });
}

function normalizedQuery() {
  return state.query.trim().toLowerCase();
}

function filteredItems() {
  const q = normalizedQuery();
  return allItems.filter((item) => {
    if (state.file !== 'all' && item.fileName !== state.file) return false;
    if (!q) return true;
    const blob = [
      item.term,
      item.translation,
      item.fileLabel,
      item.sectionLabel,
      item.sectionTitle,
    ]
      .join(' ')
      .toLowerCase();
    return blob.includes(q);
  });
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()];
}

function renderHero() {
  const activeFile = files.find((file) => file.file === state.file);
  const hasQuery = !!normalizedQuery();
  els.pageTitle.textContent = hasQuery
    ? '搜索结果'
    : state.file === 'all'
      ? '浏览全部内容'
      : activeFile.label;
  els.pageSubtitle.textContent = hasQuery
    ? '搜索会同时匹配英文、中文、分类和分组。'
    : state.file === 'all'
      ? '先看分类概览，再点进具体分组。'
      : `当前正在查看「${activeFile.label}」的全部分组。`;

  const sample = hasQuery
    ? filteredItems().slice(0, 1)[0]
    : activeFile.overview[0];

  els.heroCard.innerHTML = sample
    ? `
      <div class="big">${escapeHtml(sample.term)}</div>
      <div>${escapeHtml(sample.translation || '无释义')}</div>
      <div class="muted">${escapeHtml(hasQuery ? '匹配样例' : '示例短语')}</div>
      <button class="speak-btn" type="button" data-speak="${escapeHtml(sample.term)}">点击朗读</button>
    `
    : `<div class="muted">没有可展示的内容。</div>`;

  els.heroCard.querySelectorAll('[data-speak]').forEach((button) => {
    button.addEventListener('click', () => speak(button.dataset.speak));
  });
}

function renderToolbar() {
  els.activeFilter.textContent = state.file === 'all'
    ? '当前过滤：全部分类'
    : `当前过滤：${files.find((file) => file.file === state.file).label}`;
  els.matchInfo.textContent = normalizedQuery()
    ? `${filteredItems().length} 条匹配`
    : `${state.file === 'all' ? data.stats.itemCount : files.find((file) => file.file === state.file).itemCount} 条内容`;
}

function renderOverview() {
  const cards = files.map((file) => {
    const preview = file.overview
      .map((item) => `<span class="badge">${escapeHtml(item.term)}</span>`)
      .join('');
    return `
      <article class="summary-card">
        <div class="topline">
          <div>
            <h3>${escapeHtml(file.label)}</h3>
            <div class="category-meta">${file.sectionCount} 个分组 · ${file.itemCount} 条</div>
          </div>
          <button class="ghost" data-jump="${escapeHtml(file.file)}" type="button">打开</button>
        </div>
        <div class="badge-row">${preview}</div>
      </article>
    `;
  }).join('');

  els.mainView.innerHTML = `<div class="overview-grid">${cards}</div>`;
  els.mainView.querySelectorAll('[data-jump]').forEach((button) => {
    button.addEventListener('click', () => {
      state.file = button.dataset.jump;
      render();
    });
  });
}

function renderSections(items) {
  const selectedFile = files.find((file) => file.file === state.file);
  const targetFiles = state.file === 'all'
    ? groupBy(items, (item) => item.fileName)
    : [[selectedFile.file, items]];

  const html = targetFiles
    .map(([fileName, fileItems]) => {
      const fileMeta = files.find((file) => file.file === fileName);
      const sections = groupBy(fileItems, (item) => item.sectionTitle);

      return `
        <div class="section-stack">
          ${sections
            .map(([sectionTitle, sectionItems]) => `
              <article class="section-card">
                <div class="section-head">
                  <div>
                    <h3>${escapeHtml(sectionItems[0].sectionLabel)}</h3>
                    <div class="section-meta">${escapeHtml(fileMeta.label)} · ${escapeHtml(sectionTitle)}</div>
                  </div>
                  <div class="section-meta">${sectionItems.length} 条</div>
                </div>
                <div class="item-grid">
                  ${sectionItems
                    .map((item) => `
                      <button class="item" type="button" data-speak="${escapeHtml(item.term)}" title="点击朗读英文">
                        <div class="term">${escapeHtml(item.term)}</div>
                        <div class="translation">${escapeHtml(item.translation || '—')}</div>
                        <div class="meta">
                          <span class="pill">${escapeHtml(fileMeta.label)}</span>
                          <span class="pill">${escapeHtml(item.sectionLabel)}</span>
                          <span class="pill">${speech.enabled ? '点击朗读' : '浏览器不支持语音'}</span>
                        </div>
                      </button>
                    `)
                    .join('')}
                </div>
              </article>
            `)
            .join('')}
        </div>
      `;
    })
    .join('');

  els.mainView.innerHTML = html || '<div class="empty">没有找到匹配内容。</div>';
  els.mainView.querySelectorAll('[data-speak]').forEach((button) => {
    button.addEventListener('click', () => speak(button.dataset.speak));
  });
}

function renderEmpty() {
  els.mainView.innerHTML = '<div class="empty">没有找到匹配内容。</div>';
}

function render() {
  renderStats();
  renderCategories();
  renderHero();
  renderToolbar();

  const items = filteredItems();
  if (!items.length) {
    renderEmpty();
    return;
  }

  if (!normalizedQuery() && state.file === 'all') {
    renderOverview();
  } else {
    renderSections(items);
  }
}

els.search.addEventListener('input', () => {
  state.query = els.search.value;
  render();
});

els.clearSearch.addEventListener('click', () => {
  state.query = '';
  els.search.value = '';
  render();
});

els.showAll.addEventListener('click', () => {
  state.file = 'all';
  render();
});

if (speech.enabled && typeof window.speechSynthesis !== 'undefined') {
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    speech.voice = voices.find((voice) => /en[-_]?US/i.test(voice.lang) || /English/i.test(voice.name)) || null;
  };
}

render();
