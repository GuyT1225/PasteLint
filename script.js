"use strict";

/* =========================
   PasteLint + SecondDraft
   Vanilla JavaScript only
========================= */

const els = {
  html: document.documentElement,
  themeButtons: document.querySelectorAll("[data-theme-choice]"),

  input: document.getElementById("inputText"),
  output: document.getElementById("outputText"),

  inputCharCount: document.getElementById("inputCharCount"),
  inputWordCount: document.getElementById("inputWordCount"),
  outputCharCount: document.getElementById("outputCharCount"),
  outputWordCount: document.getElementById("outputWordCount"),

  cleanBtn: document.getElementById("cleanBtn"),
  improveBtn: document.getElementById("improveBtn"),
  versionsBtn: document.getElementById("versionsBtn"),
  copyBtn: document.getElementById("copyBtn"),
  clearBtn: document.getElementById("clearBtn"),

  toneSelect: document.getElementById("toneSelect"),
  lengthSelect: document.getElementById("lengthSelect"),
  structureSelect: document.getElementById("structureSelect"),
  versionSelect: document.getElementById("versionSelect"),

  analysisList: document.getElementById("analysisList"),
  impactList: document.getElementById("impactList"),
  changePreview: document.getElementById("changePreview"),

  versionsPanel: document.getElementById("versionsPanel"),
  versionConcise: document.getElementById("versionConcise"),
  versionNatural: document.getElementById("versionNatural"),
  versionDirect: document.getElementById("versionDirect")
};

const FILLER_PHRASES = [
  "it is important to note that",
  "it should be noted that",
  "in order to",
  "due to the fact that",
  "at this point in time",
  "in today's fast-paced world",
  "needless to say",
  "as a matter of fact",
  "the fact of the matter is",
  "when it comes to"
];

const WORD_REPLACEMENTS = {
  utilize: "use",
  utilizes: "uses",
  utilized: "used",
  utilizing: "using",
  assistance: "help",
  numerous: "many",
  demonstrate: "show",
  demonstrates: "shows",
  additionally: "also",
  nevertheless: "still",
  therefore: "so",
  subsequently: "then",
  regarding: "about",
  facilitate: "help",
  approximately: "about",
  "a variety of different": "many",
  "plays a crucial role": "helps",
  "is able to": "can",
  "are able to": "can"
};

const TONE_RULES = {
  natural: [
    [/please be advised that\s+/gi, ""],
    [/we would like to inform you that\s+/gi, ""],
    [/it is recommended that you\s+/gi, "you should "]
  ],
  concise: [
    [/in the event that/gi, "if"],
    [/for the purpose of/gi, "to"],
    [/in close proximity to/gi, "near"],
    [/at a later time/gi, "later"]
  ],
  professional: [
    [/\bgot it\b/gi, "understood"],
    [/\bthanks\b/gi, "thank you"],
    [/\bASAP\b/g, "as soon as possible"]
  ],
  friendly: [
    [/please review/gi, "please take a look at"],
    [/contact us/gi, "reach out to us"],
    [/you must/gi, "you’ll need to"]
  ],
  direct: [
    [/you may want to consider/gi, "consider"],
    [/it may be helpful to/gi, ""],
    [/we kindly ask that you/gi, "please"],
    [/please do not hesitate to/gi, "please"]
  ]
};

/* =========================
   Setup
========================= */

document.addEventListener("DOMContentLoaded", init);

function init() {
  restoreTheme();
  bindEvents();
  updateCounts();
  updateAnalysis();
}

function bindEvents() {
  els.themeButtons.forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
  });

  els.input.addEventListener("input", () => {
    updateCounts();
    updateAnalysis();
  });

  els.cleanBtn.addEventListener("click", handleClean);
  els.improveBtn.addEventListener("click", handleImprove);
  els.versionsBtn.addEventListener("click", handleVersions);
  els.copyBtn.addEventListener("click", copyOutput);
  els.clearBtn.addEventListener("click", clearAll);

  [els.toneSelect, els.lengthSelect, els.structureSelect, els.versionSelect].forEach((control) => {
    control.addEventListener("change", () => {
      if (els.output.value.trim()) handleImprove();
    });
  });
}

/* =========================
   Themes
========================= */

function setTheme(theme) {
  els.html.setAttribute("data-theme", theme);
  localStorage.setItem("pastelint-theme", theme);

  els.themeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.themeChoice === theme);
  });
}

function restoreTheme() {
  const savedTheme = localStorage.getItem("pastelint-theme") || "light";
  setTheme(savedTheme);
}

/* =========================
   Core Handlers
========================= */

function handleClean() {
  const original = els.input.value;
  if (!original.trim()) return showEmptyState();

  const cleaned = cleanText(original);
  const changes = buildChangeSummary(original, cleaned, "clean");

  els.output.value = cleaned;
  renderImpact(changes);
  renderChangePreview(changes.previewItems);
  updateCounts();
}

function handleImprove() {
  const original = els.input.value;
  if (!original.trim()) return showEmptyState();

  const cleaned = cleanText(original);
  const options = getOptions();
  const improved = reviseText(cleaned, options);
  const changes = buildChangeSummary(original, improved, "improve");

  els.output.value = improved;
  renderImpact(changes);
  renderChangePreview(changes.previewItems);
  updateCounts();
}

function handleVersions() {
  const original = els.input.value;
  if (!original.trim()) return showEmptyState();

  const cleaned = cleanText(original);

  const concise = reviseText(cleaned, {
    tone: "concise",
    length: "shorter",
    structure: els.structureSelect.value,
    version: "concise"
  });

  const natural = reviseText(cleaned, {
    tone: "natural",
    length: "similar",
    structure: els.structureSelect.value,
    version: "natural"
  });

  const direct = reviseText(cleaned, {
    tone: "direct",
    length: "shorter",
    structure: els.structureSelect.value,
    version: "direct"
  });

  els.versionConcise.textContent = concise;
  els.versionNatural.textContent = natural;
  els.versionDirect.textContent = direct;
  els.versionsPanel.classList.remove("hidden");

  els.output.value = natural;

  const changes = buildChangeSummary(original, natural, "versions");
  renderImpact(changes);
  renderChangePreview(changes.previewItems);
  updateCounts();
}

function getOptions() {
  return {
    tone: els.toneSelect.value,
    length: els.lengthSelect.value,
    structure: els.structureSelect.value,
    version: els.versionSelect.value
  };
}

/* =========================
   Stage 1: Clean Text
========================= */

function cleanText(text) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([.!?]){2,}/g, "$1")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])([^\s\n])/g, "$1 $2")
    .trim();
}

/* =========================
   Stage 2: SecondDraft
========================= */

function reviseText(text, options) {
  let revised = text;

  revised = removeFiller(revised);
  revised = simplifyWords(revised);
  revised = applyTone(revised, options.tone);
  revised = applyVersion(revised, options.version);
  revised = applyLength(revised, options.length);
  revised = applyStructure(revised, options.structure);
  revised = polishSpacing(revised);

  return revised.trim();
}

function removeFiller(text) {
  let output = text;

  FILLER_PHRASES.forEach((phrase) => {
    const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b[,]?\\s*`, "gi");
    output = output.replace(regex, "");
  });

  return output;
}

function simplifyWords(text) {
  let output = text;

  Object.entries(WORD_REPLACEMENTS).forEach(([from, to]) => {
    const regex = new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi");
    output = output.replace(regex, matchCase(to, from));
  });

  return output;
}

function applyTone(text, tone) {
  let output = text;
  const rules = TONE_RULES[tone] || [];

  rules.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });

  return output;
}

function applyVersion(text, version) {
  if (version === "concise") {
    return text
      .replace(/\bvery\s+/gi, "")
      .replace(/\breally\s+/gi, "")
      .replace(/\bsignificantly\s+/gi, "")
      .replace(/\boverall\s+/gi, "")
      .replace(/\bin many different ways\b/gi, "in many ways");
  }

  if (version === "direct") {
    return text
      .replace(/\bI think that\s+/gi, "")
      .replace(/\bI believe that\s+/gi, "")
      .replace(/\bperhaps\s+/gi, "")
      .replace(/\bmaybe\s+/gi, "")
      .replace(/\bjust\s+/gi, "");
  }

  return text
    .replace(/\bkind of\b/gi, "somewhat")
    .replace(/\bsort of\b/gi, "somewhat");
}

function applyLength(text, length) {
  if (length === "shorter") {
    return shortenText(text);
  }

  if (length === "expand") {
    return expandSlightly(text);
  }

  return text;
}

function shortenText(text) {
  return text
    .replace(/\bthat is designed to\b/gi, "that")
    .replace(/\bwhich is intended to\b/gi, "to")
    .replace(/\bin a way that\b/gi, "so")
    .replace(/\bfor the reason that\b/gi, "because")
    .replace(/\bwith the goal of\b/gi, "to");
}

function expandSlightly(text) {
  const sentences = splitSentences(text);

  if (sentences.length <= 1 && text.length > 40) {
    return `${text} This helps make the message easier to understand.`;
  }

  return text;
}

function applyStructure(text, structure) {
  if (structure !== "reflow") return text;

  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function polishSpacing(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([.!?])\s+([a-z])/g, (_, punctuation, letter) => `${punctuation} ${letter.toUpperCase()}`)
    .replace(/^\s*([a-z])/, (_, letter) => letter.toUpperCase())
    .trim();
}

/* =========================
   Analysis + Impact
========================= */

function analyzeText(text) {
  const sentences = splitSentences(text);
  const words = getWords(text);
  const lower = text.toLowerCase();

  const longSentences = sentences.filter((sentence) => getWords(sentence).length > 24).length;
  const fillerCount = FILLER_PHRASES.reduce((count, phrase) => {
    return count + countMatches(lower, phrase);
  }, 0);

  const formalWords = Object.keys(WORD_REPLACEMENTS).filter((word) => {
    return lower.includes(word.toLowerCase());
  }).length;

  const repeatedWords = findRepeatedWords(words);

  return {
    longSentences,
    fillerCount,
    formalWords,
    repeatedWords
  };
}

function updateAnalysis() {
  const text = els.input.value.trim();

  if (!text) {
    renderList(els.analysisList, ["Paste text to see a quick readability check."]);
    return;
  }

  const analysis = analyzeText(text);
  const items = [];

  if (analysis.longSentences > 0) {
    items.push(`${analysis.longSentences} long sentence${plural(analysis.longSentences)} could be easier to scan.`);
  }

  if (analysis.fillerCount > 0) {
    items.push(`${analysis.fillerCount} filler phrase${plural(analysis.fillerCount)} may slow the writing down.`);
  }

  if (analysis.formalWords > 0) {
    items.push(`${analysis.formalWords} formal word${plural(analysis.formalWords)} could be simpler.`);
  }

  if (analysis.repeatedWords.length > 0) {
    items.push(`Repeated wording found: ${analysis.repeatedWords.slice(0, 3).join(", ")}.`);
  }

  if (!items.length) {
    items.push("This text is already fairly clean. A light revision may still improve flow.");
  }

  renderList(els.analysisList, items);
}

function buildChangeSummary(original, revised, mode) {
  const originalAnalysis = analyzeText(original);
  const revisedAnalysis = analyzeText(revised);

  const fillerRemoved = Math.max(0, originalAnalysis.fillerCount - revisedAnalysis.fillerCount);
  const formalSimplified = countSimplifiedWords(original, revised);
  const sentenceReduction = Math.max(0, splitSentences(original).length - splitSentences(revised).length);
  const charReduction = Math.max(0, original.length - revised.length);

  const impactItems = [];

  if (mode === "clean") {
    impactItems.push("Cleaned spacing, punctuation, and hidden formatting.");
  }

  if (fillerRemoved > 0) {
    impactItems.push(`Removed ${fillerRemoved} filler phrase${plural(fillerRemoved)}.`);
  }

  if (formalSimplified > 0) {
    impactItems.push(`Simplified ${formalSimplified} word or phrase choice${plural(formalSimplified)}.`);
  }

  if (sentenceReduction > 0) {
    impactItems.push(`Reduced sentence count by ${sentenceReduction}.`);
  }

  if (charReduction > 20) {
    impactItems.push(`Trimmed about ${charReduction} characters.`);
  }

  if (!impactItems.length) {
    impactItems.push("No major edits needed. The text was already clear.");
  }

  return {
    impactItems,
    previewItems: buildPreviewItems(original, revised)
  };
}

function countSimplifiedWords(original, revised) {
  const originalLower = original.toLowerCase();
  const revisedLower = revised.toLowerCase();

  return Object.entries(WORD_REPLACEMENTS).reduce((count, [from, to]) => {
    const before = countMatches(originalLower, from.toLowerCase());
    const after = countMatches(revisedLower, to.toLowerCase());
    return before > 0 && after > 0 ? count + 1 : count;
  }, 0);
}

function buildPreviewItems(original, revised) {
  const items = [];
  const originalLower = original.toLowerCase();
  const revisedLower = revised.toLowerCase();

  FILLER_PHRASES.forEach((phrase) => {
    if (originalLower.includes(phrase) && !revisedLower.includes(phrase)) {
      items.push({
        type: "removed",
        before: phrase,
        after: "removed"
      });
    }
  });

  Object.entries(WORD_REPLACEMENTS).forEach(([from, to]) => {
    if (originalLower.includes(from.toLowerCase()) && revisedLower.includes(to.toLowerCase())) {
      items.push({
        type: "replaced",
        before: from,
        after: to
      });
    }
  });

  return items.slice(0, 8);
}

function renderImpact(summary) {
  renderList(els.impactList, summary.impactItems);
}

function renderChangePreview(items) {
  if (!items.length) {
    els.changePreview.textContent = "No obvious word-level edits to show. The improvement was mostly spacing, structure, or flow.";
    return;
  }

  els.changePreview.innerHTML = items.map((item) => {
    if (item.type === "removed") {
      return `
        <div class="change-row">
          <span class="removed-text">${escapeHtml(item.before)}</span>
          <span class="arrow">→</span>
          <span class="muted-text">removed</span>
        </div>
      `;
    }

    return `
      <div class="change-row">
        <span class="removed-text">${escapeHtml(item.before)}</span>
        <span class="arrow">→</span>
        <span class="added-text">${escapeHtml(item.after)}</span>
      </div>
    `;
  }).join("");
}

/* =========================
   Counters + Utility UI
========================= */

function updateCounts() {
  updateTextStats(els.input.value, els.inputCharCount, els.inputWordCount);
  updateTextStats(els.output.value, els.outputCharCount, els.outputWordCount);
}

function updateTextStats(text, charEl, wordEl) {
  const chars = text.length;
  const words = getWords(text).length;

  charEl.textContent = `${chars} char${plural(chars)}`;
  wordEl.textContent = `${words} word${plural(words)}`;
}

async function copyOutput() {
  const text = els.output.value.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    els.copyBtn.textContent = "Copied";
    setTimeout(() => {
      els.copyBtn.textContent = "Copy Output";
    }, 1200);
  } catch {
    els.output.select();
    document.execCommand("copy");
  }
}

function clearAll() {
  els.input.value = "";
  els.output.value = "";
  els.versionsPanel.classList.add("hidden");
  els.changePreview.textContent = "Paste text and click Improve Text to see visible changes.";
  renderList(els.analysisList, ["Paste text to see a quick readability check."]);
  renderList(els.impactList, ["No changes yet."]);
  updateCounts();
}

function showEmptyState() {
  renderList(els.analysisList, ["Paste text first, then choose Clean Text or Improve Text."]);
}

/* =========================
   Text Helpers
========================= */

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function getWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function findRepeatedWords(words) {
  const ignore = new Set([
    "the", "and", "or", "to", "of", "in", "a", "an", "is", "it", "for", "on", "with", "this", "that"
  ]);

  const counts = {};

  words.forEach((word) => {
    const clean = word.toLowerCase().replace(/[^a-z0-9']/g, "");
    if (!clean || ignore.has(clean) || clean.length < 4) return;
    counts[clean] = (counts[clean] || 0) + 1;
  });

  return Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .map(([word]) => word);
}

function countMatches(text, search) {
  if (!search) return 0;
  const regex = new RegExp(`\\b${escapeRegExp(search)}\\b`, "gi");
  return (text.match(regex) || []).length;
}

function renderList(listEl, items) {
  listEl.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function plural(count) {
  return count === 1 ? "" : "s";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function matchCase(replacement, source) {
  if (!source) return replacement;
  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}
