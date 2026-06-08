const data = window.PHRASE_DATA;

if (!data) {
  throw new Error('PHRASE_DATA is missing. Load data.js before app.js.');
}

const state = {
  query: '',
  file: 'all',
};

const speech = {
  enabled:
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window,
  voice: null,
};

const playback = {
  token: 0,
  mode: null,
  label: '',
  loop: false,
};

let currentUtterance = null;
let pendingFinish = null;

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
  playbackStatus: document.getElementById('playbackStatus'),
  playAllLoop: document.getElementById('playAllLoop'),
  stopPlayback: document.getElementById('stopPlayback'),
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
  return /[,.!?;:]/.test(text) ? 0.92 : 0.98;
}

function getPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    speech.voice ||
    voices.find((voice) => /en[-_]?US/i.test(voice.lang) || /English/i.test(voice.name)) ||
    null
  );
}

function renderPlaybackStatus() {
  if (!els.playbackStatus) return;
  if (!speech.enabled) {
    els.playbackStatus.textContent = '当前浏览器不支持语音朗读';
    return;
  }

  if (playback.mode) {
    const modeLabel = playback.mode === 'all' ? '全部循环' : '单元循环';
    els.playbackStatus.textContent = `播放中：${modeLabel}${playback.label ? ` · ${playback.label}` : ''}`;
  } else {
    els.playbackStatus.textContent = '播放状态：已停止';
  }
}

function cancelPlayback() {
  playback.token += 1;
  playback.mode = null;
  playback.label = '';
  playback.loop = false;

  if (speech.enabled) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;

  if (pendingFinish) {
    const finish = pendingFinish;
    pendingFinish = null;
    finish();
  }

  renderPlaybackStatus();
}

function speak(text) {
  if (!speech.enabled || !text) return;

  cancelPlayback();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = getSpeechRate(text);
  utterance.pitch = 1;
  utterance.volume = 1;

  const preferred = getPreferredVoice();
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

function speakAsync(text, token) {
  return new Promise((resolve) => {
    if (!speech.enabled || !text || token !== playback.token) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = getSpeechRate(text);
    utterance.pitch = 1;
    utterance.volume = 1;

    const preferred = getPreferredVoice();
    if (preferred) utterance.voice = preferred;

    let finished = false;
    const timeout = window.setTimeout(() => finish(), Math.max(4000, text.length * 140));

    function finish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      if (currentUtterance === utterance) currentUtterance = null;
      if (pendingFinish === finish) pendingFinish = null;
      resolve();
    }

    pendingFinish = finish;
    currentUtterance = utterance;
    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
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

function renderStats() {
  const fileCount = data.stats.fileCount;
  const sectionCount = data.stats.sectionCount;
  const itemCount = data.stats.itemCount;
  const currentCount = state.file === 'all'
    ? itemCount
    : (files.find((file) => file.file === state.file) || { itemCount: 0 }).itemCount;

  els.stats.innerHTML = [
    ['文件', fileCount],
    ['分组', sectionCount],
    ['条目', itemCount],
    ['当前', currentCount],
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
      stopPlayback();
      state.file = button.dataset.file;
      render();
    });
  });
}

function renderHero() {
  const activeFile = files.find((file) => file.file === state.file) || files[0];
  const hasQuery = !!normalizedQuery();
  const sample = hasQuery ? filteredItems().slice(0, 1)[0] : activeFile.overview[0];

  els.pageTitle.textContent = hasQuery
    ? '搜索结果'
    : state.file === 'all'
      ? '浏览全部内容'
      : activeFile.label;

  els.pageSubtitle.textContent = hasQuery
    ? '搜索会同时匹配英文、中文、分组和单元。'
    : state.file === 'all'
      ? '先看分类概览，再进入具体单元。'
      : `当前正在查看「${activeFile.label}」的全部分组。`;

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
  const activeFile = files.find((file) => file.file === state.file) || { label: '全部内容', itemCount: data.stats.itemCount };
  els.activeFilter.textContent = state.file === 'all'
    ? '当前过滤：全部分类'
    : `当前过滤：${activeFile.label}`;
  els.matchInfo.textContent = normalizedQuery()
    ? `${filteredItems().length} 条匹配`
    : `${state.file === 'all' ? data.stats.itemCount : activeFile.itemCount} 条内容`;
  renderPlaybackStatus();
}

function getItemTermsFromCard(card) {
  return [...card.querySelectorAll('.item')].map((button) => button.dataset.speak).filter(Boolean);
}

function startPlayback(terms, { loop = false, label = '' } = {}) {
  const queue = (terms || []).map((term) => (typeof term === 'string' ? term : term?.term)).filter(Boolean);
  if (!speech.enabled || !queue.length) {
    renderPlaybackStatus();
    return;
  }

  cancelPlayback();

  const token = playback.token;
  playback.mode = loop ? 'all' : 'section';
  playback.label = label || `${queue.length} 条`;
  playback.loop = loop;
  renderPlaybackStatus();

  void (async () => {
    do {
      for (const term of queue) {
        if (token !== playback.token) return;
        await speakAsync(term, token);
        if (token !== playback.token) return;
      }
    } while (loop && token === playback.token);

    if (token === playback.token) {
      playback.mode = null;
      playback.label = '';
      playback.loop = false;
      renderPlaybackStatus();
    }
  })();
}

function bindPlaybackButtons() {
  if (els.playAllLoop) {
    els.playAllLoop.addEventListener('click', () => {
      startPlayback(filteredItems(), {
        loop: true,
        label: state.file === 'all'
          ? `${filteredItems().length} 条`
          : `${(files.find((file) => file.file === state.file) || { itemCount: 0 }).itemCount} 条`,
      });
    });
  }

  if (els.stopPlayback) {
    els.stopPlayback.addEventListener('click', stopPlayback);
  }

  els.mainView.querySelectorAll('[data-play-section-loop]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.section-card');
      if (!card) return;
      const terms = getItemTermsFromCard(card);
      const title = button.dataset.sectionTitle || '';
      startPlayback(terms, {
        loop: true,
        label: title ? title : `${terms.length} 条`,
      });
    });
  });

  els.mainView.querySelectorAll('[data-stop-playback]').forEach((button) => {
    button.addEventListener('click', stopPlayback);
  });
}

function renderOverview() {
  const cards = files
    .map((file) => {
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
    })
    .join('');

  els.mainView.innerHTML = `<div class="overview-grid">${cards}</div>`;
  els.mainView.querySelectorAll('[data-jump]').forEach((button) => {
    button.addEventListener('click', () => {
      stopPlayback();
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
                  <div class="section-actions">
                    <div class="section-meta">${sectionItems.length} 条</div>
                    <button
                      class="ghost"
                      type="button"
                      data-play-section-loop="1"
                      data-section-title="${escapeHtml(sectionTitle)}"
                    >
                      单元循环
                    </button>
                    <button class="ghost danger" type="button" data-stop-playback="1">停止</button>
                  </div>
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
    bindPlaybackButtons();
    return;
  }

  if (!normalizedQuery() && state.file === 'all') {
    renderOverview();
  } else {
    renderSections(items);
  }

  bindPlaybackButtons();
}

function stopPlayback() {
  cancelPlayback();
}

els.search.addEventListener('input', () => {
  stopPlayback();
  state.query = els.search.value;
  render();
});

els.clearSearch.addEventListener('click', () => {
  stopPlayback();
  state.query = '';
  els.search.value = '';
  render();
});

els.showAll.addEventListener('click', () => {
  stopPlayback();
  state.file = 'all';
  render();
});

if (speech.enabled && typeof window.speechSynthesis !== 'undefined') {
  window.speechSynthesis.onvoiceschanged = () => {
    speech.voice = getPreferredVoice();
  };
}

render();
