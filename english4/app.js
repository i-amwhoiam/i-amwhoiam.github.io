const library = window.PHRASE_LIBRARY;

if (!library || !Array.isArray(library.sources)) {
  throw new Error("phrases.js 未加载成功。");
}

const sourceCountEl = document.querySelector("#source-count");
const itemCountEl = document.querySelector("#item-count");
const sourceListEl = document.querySelector("#source-list");
const sectionContainerEl = document.querySelector("#section-container");
const searchInputEl = document.querySelector("#search-input");
const voiceSelectEl = document.querySelector("#voice-select");
const rateInputEl = document.querySelector("#rate-input");
const stopButtonEl = document.querySelector("#stop-button");
const statusTextEl = document.querySelector("#status-text");

let selectedSourceId = library.sources[0]?.id ?? "";
let voices = [];

function setStatus(text) {
  statusTextEl.textContent = text;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSelectedSource() {
  return library.sources.find((source) => source.id === selectedSourceId) ?? library.sources[0];
}

function getFilteredSections() {
  const source = getSelectedSource();
  const keyword = searchInputEl.value.trim().toLowerCase();

  if (!source) {
    return [];
  }

  return source.sections
    .map((section) => {
      const items = keyword
        ? section.items.filter((item) => {
            const haystack = `${item.text} ${item.note} ${item.raw}`.toLowerCase();
            return haystack.includes(keyword);
          })
        : section.items;

      return {
        ...section,
        items,
      };
    })
    .filter((section) => section.items.length > 0);
}

function renderSourceList() {
  sourceListEl.innerHTML = library.sources
    .map((source) => {
      const activeClass = source.id === selectedSourceId ? " active" : "";
      return `
        <button class="source-button${activeClass}" type="button" data-source-id="${source.id}">
          <span class="source-name">${escapeHtml(source.title)}</span>
          <span class="source-meta">${source.sectionCount} 个分组 · ${source.itemCount} 条</span>
        </button>
      `;
    })
    .join("");
}

function renderSections() {
  const sections = getFilteredSections();

  if (sections.length === 0) {
    sectionContainerEl.innerHTML = '<div class="empty-state">没有匹配结果，换个关键词试试。</div>';
    return;
  }

  sectionContainerEl.innerHTML = sections
    .map((section) => {
      const itemCards = section.items
        .map(
          (item) => `
            <button
              class="phrase-card"
              type="button"
              data-speak="${escapeHtml(item.speakText)}"
              data-text="${escapeHtml(item.text)}"
            >
              <span class="phrase-text">${escapeHtml(item.text)}</span>
              ${item.note ? `<span class="phrase-note">${escapeHtml(item.note)}</span>` : ""}
              <span class="phrase-hint">Click to speak</span>
            </button>
          `,
        )
        .join("");

      return `
        <section class="section-card">
          <div class="section-header">
            <h2 class="section-title">${escapeHtml(section.heading)}</h2>
            <span class="section-range">${section.items.length} 条${section.range ? ` · ${escapeHtml(section.range)}` : ""}</span>
          </div>
          <div class="item-grid">${itemCards}</div>
        </section>
      `;
    })
    .join("");
}

function renderStats() {
  sourceCountEl.textContent = String(library.sourceCount);
  itemCountEl.textContent = String(library.itemCount);
}

function pickDefaultVoice() {
  const voiceSelectValue = voiceSelectEl.value;

  if (voiceSelectValue && voices.some((voice) => voice.name === voiceSelectValue)) {
    return;
  }

  const englishVoice =
    voices.find((voice) => /^en(-|_)/i.test(voice.lang) && /female|zira|aria|davis|jenny|guy|samantha/i.test(voice.name)) ||
    voices.find((voice) => /^en(-|_)/i.test(voice.lang)) ||
    voices[0];

  if (englishVoice) {
    voiceSelectEl.value = englishVoice.name;
  }
}

function renderVoices() {
  if (!("speechSynthesis" in window)) {
    voiceSelectEl.innerHTML = '<option value="">当前浏览器不支持语音</option>';
    return;
  }

  voices = window.speechSynthesis.getVoices();

  if (voices.length === 0) {
    voiceSelectEl.innerHTML = '<option value="">浏览器还没加载音色</option>';
    return;
  }

  voiceSelectEl.innerHTML = voices
    .map((voice) => `<option value="${escapeHtml(voice.name)}">${escapeHtml(`${voice.name} (${voice.lang})`)}</option>`)
    .join("");

  pickDefaultVoice();
}

function speak(text, label) {
  if (!("speechSynthesis" in window)) {
    setStatus("当前浏览器不支持语音朗读。");
    return;
  }

  const value = text.trim();
  if (!value) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(value);
  const selectedVoice = voices.find((voice) => voice.name === voiceSelectEl.value);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = "en-US";
  }

  utterance.rate = Number(rateInputEl.value || 0.95);
  utterance.onstart = () => setStatus(`正在朗读：${label}`);
  utterance.onend = () => setStatus(`朗读完成：${label}`);
  utterance.onerror = () => setStatus(`朗读失败：${label}`);

  window.speechSynthesis.speak(utterance);
}

function bindEvents() {
  sourceListEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-source-id]");
    if (!button) {
      return;
    }

    selectedSourceId = button.dataset.sourceId;
    renderSourceList();
    renderSections();
    setStatus(`已切换到：${getSelectedSource().title}`);
  });

  searchInputEl.addEventListener("input", () => {
    renderSections();
  });

  sectionContainerEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speak]");
    if (!button) {
      return;
    }

    speak(button.dataset.speak, button.dataset.text);
  });

  stopButtonEl.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setStatus("已停止朗读");
  });
}

function init() {
  renderStats();
  renderSourceList();
  renderSections();
  renderVoices();
  bindEvents();
  if ("speechSynthesis" in window) {
    setStatus("点击词条即可发音");
  } else {
    stopButtonEl.disabled = true;
    setStatus("当前浏览器不支持语音朗读，但数据仍可浏览");
  }
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = renderVoices;
}

init();
