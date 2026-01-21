// 词库浏览脚本（兼容 #status / #counter，默认 en-US 语音，支持 单词+句子 IPA 与 TTS）
(function(){
  'use strict';

  // === DOM ===
  const packSelect  = document.getElementById('packSelect');
  const searchInput = document.getElementById('searchInput');
  const tableBody   = document.querySelector('#wordsTable tbody');
  const reloadBtn   = document.getElementById('reloadBtn');
  const showExamples= document.getElementById('showExamples');
  const showPronWord= document.getElementById('showPronWord');
  const showPronSent= document.getElementById('showPronSent');
  const voiceSelect = document.getElementById('voiceSelect');
  const rateInput   = document.getElementById('rate');
  const volumeInput = document.getElementById('volume');

  // 容错：优先使用 #status；若无且 #counter 也没有，则动态创建一个 #status 并与 #counter 同步
  let statusEl  = document.querySelector('#status');
  const counterEl = document.querySelector('#counter');
  if (!statusEl && !counterEl) {
    const el = document.createElement('div');
    el.id = 'status';
    el.className = 'counter';
    (document.querySelector('header') || document.body).appendChild(el);
    statusEl = el;
  }
  function setStatusText(text){
    if (statusEl)  statusEl.textContent  = text;
    if (counterEl) counterEl.textContent = text; // 同步到 #counter
  }

  // === 数据源 ===
  // 回退词包列表（manifest 不可用时启用）
  const fallbackPacks = [
    {file:'integration-apis-and-protocols.json', title:'APIs & Protocols', group:'Integration · Recommended', path:'./'},
    {file:'ci-cd-and-environments.json',        title:'CI/CD & Environments', group:'Integration · Recommended', path:'./'},
    {file:'observability-and-reliability.json',  title:'Observability & Reliability', group:'Integration · Recommended', path:'./'},
    {file:'months.json',                         title:'Months（月）', group:'Foundational Vocabulary', path:'./'},
    {file:'days.json',                           title:'Days（星期）', group:'Foundational Vocabulary', path:'./'},
    {file:'colors.json',                         title:'Colors（颜色）', group:'Foundational Vocabulary', path:'./'},
    {file:'numbers-basic.json',                  title:'Numbers（数字）', group:'Foundational Vocabulary', path:'./'},
    {file:'ordinals.json',                       title:'Ordinals（序数）', group:'Foundational Vocabulary', path:'./'},
    {file:'seasons.json',                        title:'Seasons（季节）', group:'Foundational Vocabulary', path:'./'},
    {file:'date-parts.json',                     title:'Date & Time（日期/时间）', group:'Foundational Vocabulary', path:'./'},
    {file:'daily-500.json',                      title:'Daily 500（日常）', group:'Existing · Core', path:'./'},
    {file:'core-1000.json',                      title:'Core 1000（核心）', group:'Existing · Core', path:'./'},
    {file:'work-500.json',                       title:'Work 500（办公）', group:'Existing · Core', path:'./'},
    {file:'oxford-3000.json',                       title:'Oxford 3000', group:'Oxford · Core', path:'./'},
    {file:'oxford-5000.json',                       title:'Oxford 5000', group:'Oxford · Core', path:'./'},
    // 可选：把你的短语库先加进回退列表，便于从下拉选择
    {file:'phrases-700.json',                    title:'Phrases 700（短语）', group:'Existing · Phrases', path:'./'}
  ];

  let packs = [];
  let currentData = [];

  // 将不同结构统一到渲染层数据结构：{ word, meaning, example, pronunciation, example_pronunciation }
  function normalizeData(json){
    if (Array.isArray(json.words)) {
      // 词库结构，直接映射
      return json.words.map(x => ({
        word: (x.word ?? ''),
        meaning: (x.meaning ?? ''),
        example: (x.example ?? ''),
        pronunciation: (x.pronunciation ?? ''),
        example_pronunciation: (x.example_pronunciation ?? '')
      }));
    }
    if (Array.isArray(json.phrases)) {
      // 短语结构：将 phrase 映射为 word；把 category 临时放到“句子 IPA/类别”列显示
      return json.phrases.map(x => ({
        word: (x.phrase ?? ''),
        meaning: (x.meaning ?? ''),
        example: (x.example ?? ''),
        pronunciation: '', // 短语一般无单词 IPA
        example_pronunciation: (x.category ?? '') // 在第 5 列展示类别
      }));
    }
    return [];
  }

  async function loadManifest(){
    try {
      const res = await fetch('./data/manifest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('manifest not found');
      const m = await res.json();
      packs = Array.isArray(m.packs) ? m.packs : fallbackPacks;
    } catch(e){
      console.warn('使用回退词包列表：', e.message);
      packs = fallbackPacks;
    }
  }

  function groupPacks(packs){
    const map = new Map();
    for (const p of packs){
      if (!map.has(p.group)) map.set(p.group, []);
      map.get(p.group).push(p);
    }
    return map;
  }

  function populateSelect(){
    packSelect.innerHTML = '';
    const grouped = groupPacks(packs);
    for (const [group, items] of grouped.entries()){
      const og = document.createElement('optgroup');
      og.label = group;
      for (const it of items){
        const opt = document.createElement('option');
        opt.value = it.file;
        opt.textContent = it.title;
        opt.dataset.path = (it.path && it.path.trim()) || './data/';
        og.appendChild(opt);
      }
      packSelect.appendChild(og);
    }
  }

  function getSelectedPack(){
    const opt = packSelect.selectedOptions[0];
    if (!opt) return null;
    return { file: opt.value, path: opt.dataset.path };
  }

  async function loadSelected(){
    const sel = getSelectedPack();
    if (!sel) return;
    const url = (sel.path.endsWith('/') ? sel.path : (sel.path + '/')) + sel.file;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok){ throw new Error('无法加载：' + url); }
    const json = await res.json();
    currentData = normalizeData(json); // 兼容 words 与 phrases
    render();
  }

  function render(){
    const q = (searchInput.value || '').trim().toLowerCase();
    const filtered = q
      ? currentData.filter(x => {
          const w  = (x.word || '').toLowerCase();
          const m  = (x.meaning || '').toLowerCase();
          const pw = (x.pronunciation || '').toLowerCase();
          const ps = (x.example_pronunciation || '').toLowerCase();
          return w.includes(q) || m.includes(q) || pw.includes(q) || ps.includes(q);
        })
      : currentData;

    tableBody.innerHTML = '';
    for (const item of filtered){
      const tr  = document.createElement('tr');
      const tdW = document.createElement('td');
      const tdPW= document.createElement('td');
      const tdM = document.createElement('td');
      const tdE = document.createElement('td');
      const tdPS= document.createElement('td');
      const tdA = document.createElement('td');

      tdW.textContent  = item.word || '';
      tdPW.textContent = item.pronunciation || '（朗读可用）';
      tdPW.className   = 'pron';
      tdM.textContent  = item.meaning || '';
      tdE.textContent  = item.example || '';
      tdPS.textContent = item.example_pronunciation || '（朗读可用）';
      tdPS.className   = 'pron';

      if (!showPronWord.checked) tdPW.style.display = 'none';
      if (!showExamples.checked) tdE.style.display   = 'none';
      if (!showPronSent.checked) tdPS.style.display  = 'none';

      const btnWord = document.createElement('button');
      btnWord.textContent = '🔊 词';
      btnWord.title = '朗读英文单词';
      btnWord.addEventListener('click', () => speak(item.word));

      const btnSent = document.createElement('button');
      btnSent.textContent = '🔊 句';
      btnSent.title = '朗读英文例句';
      btnSent.addEventListener('click', () => speak(item.example || item.word));

      tdA.appendChild(btnWord);
      tdA.appendChild(document.createTextNode(' '));
      tdA.appendChild(btnSent);

      tr.appendChild(tdW); tr.appendChild(tdPW); tr.appendChild(tdM);
      tr.appendChild(tdE); tr.appendChild(tdPS); tr.appendChild(tdA);
      tableBody.appendChild(tr);
    }

    setStatusText(`显示 ${filtered.length} / 总计 ${currentData.length}`);
  }

  // === 语音/TTS ===
  let voices = [];
  function populateVoices(){
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    voiceSelect.innerHTML = '';
    const sorted = voices.slice().sort((a,b)=> (a.lang||'').localeCompare(b.lang||''));
    for (const v of sorted){
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} (${v.lang})`;
      voiceSelect.appendChild(opt);
    }
    // 默认选择美式英语（en-US），否则 en-GB，否则首项
    const opts = Array.from(voiceSelect.options);
    const enUS = opts.find(o => /(en-US)/.test(o.textContent||''));
    const enGB = opts.find(o => /(en-GB)/.test(o.textContent||''));
    if (enUS) voiceSelect.value = enUS.value;
    else if (enGB) voiceSelect.value = enGB.value;
    else if (voiceSelect.options.length) voiceSelect.selectedIndex = 0;
  }

  function findVoiceByName(name){
    return voices.find(v => v.name === name);
  }

  function speak(text){
    if (!text) return;
    if (!window.speechSynthesis){
      alert('当前浏览器不支持朗读（SpeechSynthesis）。');
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const selected = findVoiceByName(voiceSelect.value);
    if (selected){ u.voice = selected; }
    u.lang = (selected && selected.lang) || 'en-US';
    u.rate = parseFloat(rateInput.value || '1');
    u.volume = parseFloat(volumeInput.value || '1');

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  if (window.speechSynthesis){
    populateVoices();
    // 部分浏览器会在异步加载完声音后触发此事件
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  // === 事件 ===
  packSelect.addEventListener('change', () => loadSelected().catch(err => alert(err.message)));
  searchInput.addEventListener('input', render);
  reloadBtn.addEventListener('click', () => loadSelected().catch(err => alert(err.message)));
  showExamples.addEventListener('change', render);
  showPronWord.addEventListener('change', render);
  showPronSent.addEventListener('change', render);

  // === 启动 ===
  (async function init(){
    setStatusText('加载中…');
    await loadManifest();
    populateSelect();

    const params = new URLSearchParams(location.search);
    const target = params.get('pack');

    if (target) {
      // 优先匹配下拉框选项
      const opt = Array.from(packSelect.options).find(o => o.value === target);
      if (opt) {
        packSelect.value = target;
        await loadSelected().catch(err => alert(err.message));
      } else {
        // 不在列表：尝试直接拉取
        const guessPaths = [
          `./${target}`,
          `./data/${target}`
        ];
        let loaded = false;
        for (const url of guessPaths){
          try {
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok){
              const json = await res.json();
              currentData = normalizeData(json);
              render();
              loaded = true;
              break;
            }
          } catch(e){ /* 继续尝试 */ }
        }
        if (!loaded) alert(`无法加载：${target}`);
      }
    } else {
      if (!packSelect.value && packSelect.options.length){ packSelect.selectedIndex = 0; }
      await loadSelected().catch(err => alert(err.message));
    }
  })();
})();
