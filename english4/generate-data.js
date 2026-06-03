const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TXT_EXT = ".txt";
const JSON_OUTPUT = path.join(ROOT, "phrases.json");
const JS_OUTPUT = path.join(ROOT, "phrases.js");

function isHeadingLine(line) {
  const text = line.trim();
  if (!text) {
    return false;
  }

  if (/^\d+\.\s*/u.test(text)) {
    return false;
  }

  if (/（\s*\d+\s*[–-]\s*\d+\s*）/u.test(text)) {
    return true;
  }

  return /^[^\p{L}\p{N}]*.*\b\d+\s*[–-]\s*\d+\b.*（.*）/u.test(text);
}

function parseHeading(rawHeading) {
  const heading = rawHeading.trim().replace(/\s+/gu, " ");
  const rangeMatch =
    heading.match(/（\s*(\d+\s*[–-]\s*\d+)\s*）/u) ||
    heading.match(/\b(\d+\s*[–-]\s*\d+)\b/u);
  const title = heading.replace(/^[^\p{L}\p{N}①②③④⑤⑥⑦⑧⑨⑩一二三四五六七八九十]+/u, "").trim();

  return {
    heading,
    title: title || heading,
    range: rangeMatch ? rangeMatch[1].replace(/\s+/gu, "") : "",
  };
}

function parseItem(rawLine, lineNumber, itemIndex) {
  const raw = rawLine.trim();
  const withoutNumber = raw.replace(/^\d+\.\s*/u, "").trim();
  const withoutMarkers = withoutNumber.replace(/\s*[✔❌]+\s*/gu, " ").replace(/\s+/gu, " ").trim();
  const noteMatch = withoutMarkers.match(/^(.*?)(?:（([^（）]+)）)\s*$/u);

  let text = withoutMarkers;
  let note = "";

  if (noteMatch && noteMatch[1].trim()) {
    text = noteMatch[1].trim();
    note = noteMatch[2].trim();
  }

  return {
    id: `item-${itemIndex}`,
    lineNumber,
    raw,
    text,
    note,
    speakText: text.replace(/\s+/gu, " ").trim(),
  };
}

function parseFile(fileName, sourceIndex) {
  const fullPath = path.join(ROOT, fileName);
  const content = fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/u, "");
  const lines = content.split(/\r?\n/u);
  const sections = [];
  let currentSection = null;
  let itemCounter = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (isHeadingLine(trimmed)) {
      const parsedHeading = parseHeading(trimmed);
      currentSection = {
        id: `source-${sourceIndex}-section-${sections.length + 1}`,
        ...parsedHeading,
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = {
        id: `source-${sourceIndex}-section-${sections.length + 1}`,
        heading: "未分组",
        title: "未分组",
        range: "",
        items: [],
      };
      sections.push(currentSection);
    }

    itemCounter += 1;
    currentSection.items.push(parseItem(trimmed, i + 1, itemCounter));
  }

  return {
    id: `source-${sourceIndex}`,
    fileName,
    title: path.basename(fileName, TXT_EXT),
    sectionCount: sections.length,
    itemCount: sections.reduce((sum, section) => sum + section.items.length, 0),
    sections,
  };
}

function buildLibrary() {
  const files = fs
    .readdirSync(ROOT)
    .filter((name) => name.toLowerCase().endsWith(TXT_EXT))
    .sort((a, b) => a.localeCompare(b, "zh-CN"));

  const sources = files.map((fileName, index) => parseFile(fileName, index + 1));
  const itemCount = sources.reduce((sum, source) => sum + source.itemCount, 0);

  return {
    generatedAt: new Date().toISOString(),
    sourceCount: sources.length,
    itemCount,
    sources,
  };
}

function writeOutputs(data) {
  const jsonText = JSON.stringify(data, null, 2);
  fs.writeFileSync(JSON_OUTPUT, jsonText, "utf8");
  fs.writeFileSync(JS_OUTPUT, `window.PHRASE_LIBRARY = ${jsonText};\n`, "utf8");
}

function main() {
  const library = buildLibrary();
  writeOutputs(library);

  console.log(`Generated ${path.basename(JSON_OUTPUT)} and ${path.basename(JS_OUTPUT)}.`);
  console.log(`Sources: ${library.sourceCount}`);
  console.log(`Items: ${library.itemCount}`);
}

main();
