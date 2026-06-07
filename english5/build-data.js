const fs = require('fs');
const path = require('path');

const root = __dirname;

const titleLineRe = /[（(]\s*\d+\s*[–-]\s*\d+\s*[)）]$/;

function readLines(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .replace(/\uFEFF/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isTitleLine(line) {
  return titleLineRe.test(line);
}

function cleanSectionLabel(title) {
  return title
    .replace(/^[🧠🔥🟢🔴⚠️\s]+/, '')
    .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]+\s*/, '')
    .replace(/^[一二三四五六七八九十]+、/, '')
    .replace(/[（(]\s*\d+\s*[–-]\s*\d+\s*[)）]$/, '')
    .trim();
}

function extractRange(title) {
  const match = title.match(/[（(]\s*(\d+)\s*[–-]\s*(\d+)\s*[)）]$/);
  return match ? `${match[1]}-${match[2]}` : '';
}

function baseName(file) {
  return path.basename(file, '.txt');
}

function createSection(title, index) {
  return {
    id: `section-${index}`,
    title,
    label: cleanSectionLabel(title),
    range: extractRange(title),
    items: [],
  };
}

function pushSection(sections, current, title) {
  if (current && current.items.length) {
    sections.push(current);
  }
  return createSection(title, sections.length);
}

function parseSingleParen(lines, file) {
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (isTitleLine(line)) {
      current = pushSection(sections, current, line);
      continue;
    }

    const match = line.match(/^(.*?)\s*[（(](.+)[)）]$/);
    const term = match ? match[1].trim() : line.trim();
    const translation = match ? match[2].trim() : '';
    current.items.push({
      term,
      translation,
      raw: line,
    });
  }

  if (current && current.items.length) sections.push(current);
  return sections;
}

function parseSingleDash(lines, file) {
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (isTitleLine(line)) {
      current = pushSection(sections, current, line);
      continue;
    }

    const match = line.match(/^(?:\d+\.\s*)?(.*?)\s+-\s+(.+)$/);
    const term = match ? match[1].trim() : line.trim();
    const translation = match ? match[2].trim() : '';
    current.items.push({
      term,
      translation,
      raw: line,
    });
  }

  if (current && current.items.length) sections.push(current);
  return sections;
}

function parseSentenceLine(lines, file) {
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (isTitleLine(line)) {
      current = pushSection(sections, current, line);
      continue;
    }

    const match = line.match(/^(.+?[.!?。])\s+(.+)$/);
    const term = match ? match[1].trim() : line.trim();
    const translation = match ? match[2].trim() : '';
    current.items.push({
      term,
      translation,
      raw: line,
    });
  }

  if (current && current.items.length) sections.push(current);
  return sections;
}

function parsePairLines(lines, file, stripCheck = false) {
  const sections = [];
  let current = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isTitleLine(line)) {
      current = pushSection(sections, current, line);
      continue;
    }

    const termLine = stripCheck ? line.replace(/[✔✓]\s*$/, '').trim() : line.trim();
    const translationLine = (lines[i + 1] || '').trim();
    current.items.push({
      term: termLine,
      translation: translationLine,
      raw: `${line}\n${translationLine}`,
    });
    i += 1;
  }

  if (current && current.items.length) sections.push(current);
  return sections;
}

const fileParsers = {
  '习语.txt': (lines) => parseSingleParen(lines),
  '固定搭配.txt': (lines) => parseSingleDash(lines),
  '功能语块（Chunks）.txt': (lines) => parseSingleDash(lines),
  '反应短块.txt': (lines) => parseSentenceLine(lines),
  '弱搭配.txt': (lines) => parsePairLines(lines, true),
  '场景脚本.txt': (lines) => parsePairLines(lines),
  '半固定句型.txt': (lines) => parsePairLines(lines),
  '思维转换.txt': (lines) => parsePairLines(lines),
  '情境功能语块.txt': (lines) => parsePairLines(lines),
  '话题组织模块.txt': (lines) => parsePairLines(lines),
  '语气系统.txt': (lines) => parsePairLines(lines),
  '语篇连接.txt': (lines) => parsePairLines(lines),
};

function parseFile(file) {
  const lines = readLines(path.join(root, file));
  const parser = fileParsers[file];
  if (!parser) {
    throw new Error(`No parser configured for ${file}`);
  }

  const sections = parser(lines, file);
  let itemCounter = 0;

  for (const [sectionIndex, section] of sections.entries()) {
    section.index = sectionIndex + 1;
    section.items = section.items.map((item, itemIndex) => ({
      id: `${baseName(file)}-${sectionIndex + 1}-${itemIndex + 1}`,
      index: itemIndex + 1,
      term: item.term,
      translation: item.translation,
      raw: item.raw,
      file,
      fileLabel: baseName(file),
      sectionId: section.id,
      sectionTitle: section.title,
      sectionLabel: section.label,
    }));
    itemCounter += section.items.length;
  }

  return {
    file,
    label: baseName(file),
    parser: file === '反应短块.txt' ? 'sentence-line' : file === '习语.txt' ? 'single-paren' : file === '固定搭配.txt' || file === '功能语块（Chunks）.txt' ? 'single-dash' : file === '弱搭配.txt' ? 'paired-with-check' : 'paired-lines',
    sections,
    sectionCount: sections.length,
    itemCount: itemCounter,
  };
}

function main() {
  const txtFiles = fs
    .readdirSync(root)
    .filter((name) => name.toLowerCase().endsWith('.txt'))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  const files = txtFiles.map(parseFile);
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDir: root,
    files,
    stats: {
      fileCount: files.length,
      sectionCount: files.reduce((sum, file) => sum + file.sectionCount, 0),
      itemCount: files.reduce((sum, file) => sum + file.itemCount, 0),
    },
  };

  const json = JSON.stringify(payload, null, 2);
  fs.writeFileSync(path.join(root, 'data.json'), `${json}\n`, 'utf8');
  fs.writeFileSync(path.join(root, 'data.js'), `window.PHRASE_DATA = ${json};\n`, 'utf8');
}

main();
