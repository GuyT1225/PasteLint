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
  improvementList: document.getElementById("improvementList"),
  changePreview: document.getElementById("changePreview"),

  versionsPanel: document.getElementById("versionsPanel"),
  versionConcise: document.getElementById("versionConcise"),
  versionNatural: document.getElementById("versionNatural"),
  versionDirect: document.getElementById("versionDirect")
};

const state = {
  inputText: "",
  cleanedText: "",
  revisedText: "",
  cleanReport: null,
  revisionReport: null,
  versions: {
    concise: "",
    natural: "",
    direct: ""
  },
  lastAction: null
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

const VERSION_RULES = {
  light: {
    label: "Light revision",
    reason: "Keeps close to the original while improving readability."
  },
  balanced: {
    label: "Balanced revision",
    reason: "Improves flow while preserving the original meaning."
  },
  strong: {
    label: "Stronger revision",
    reason: "Makes clearer, more direct edits while avoiding unnecessary rewriting."
  }
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  restoreTheme();
  bindEvents();
  syncStateFromUI();
  updateCounts();
  updateAnalysis();
  renderList(els.impactList, ["No changes yet."]);
  renderList(els.improvementList, ["No improvements yet."]);
}

function bindEvents() {
  els.themeButtons.forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
  });

  els.input.addEventListener("input", () => {
    syncStateFromUI();
    updateCounts();
    updateAnalysis();
  });

  els.cleanBtn.addEventListener("click", handleClean);
  els.improveBtn.addEventListener("click", handleImprove);
  els.versionsBtn.addEventListener("click", handleVersions);
  els.copyBtn.addEventListener("click", copyOutput);
  els.clearBtn.addEventListener("click", clearAll);

  [els.toneSelect, els.lengthSelect, els.structureSelect, els.versionSelect].forEach((control) => {
    if (!control) return;

    control.addEventListener("change", () => {
      syncStateFromUI();

      if (state.lastAction === "improve" && state.inputText.trim()) handleImprove();
      if (state.lastAction === "versions" && state.inputText.trim()) handleVersions();
    });
  });
}

function syncStateFromUI() {
  state.inputText = els.input.value || "";
}

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

function handleClean() {
  syncStateFromUI();

  if (!state.inputText.trim()) return showEmptyState();

  const result = runCleanPipeline(state.inputText);

  state.cleanedText = result.text;
  state.cleanReport = result.report;
  state.revisedText = "";
  state.revisionReport = null;
  state.lastAction = "clean";

  els.output.value = result.text;
  els.versionsPanel.classList.add("hidden");

  renderImpact(result.report);
  renderImprovements(result.report);
  renderChangePreview(result.report.previewItems);
  updateCounts();
}

function handleImprove() {
  syncStateFromUI();

  if (!state.inputText.trim()) return showEmptyState();

  const cleanResult = runCleanPipeline(state.inputText);
  const revisionResult = runRevisionPipeline(cleanResult.text, getOptions());

  state.cleanedText = cleanResult.text;
  state.cleanReport = cleanResult.report;
  state.revisedText = revisionResult.text;
  state.revisionReport = revisionResult.report;
  state.lastAction = "improve";

  els.output.value = revisionResult.text;
  els.versionsPanel.classList.add("hidden");

  renderImpact(revisionResult.report);
  renderImprovements(revisionResult.report);
  renderChangePreview(revisionResult.report.previewItems);
  updateCounts();
}

function handleVersions() {
  syncStateFromUI();

  if (!state.inputText.trim()) return showEmptyState();

  const cleanResult = runCleanPipeline(state.inputText);
  const structure = getSelectedValue(els.structureSelect, "preserve");

  const conciseResult = runRevisionPipeline(cleanResult.text, {
    tone: "concise",
    length: "shorter",
    structure,
    version: "light"
  });

  const naturalResult = runRevisionPipeline(cleanResult.text, {
    tone: "natural",
    length: "similar",
    structure,
    version: "balanced"
  });

  const directResult = runRevisionPipeline(cleanResult.text, {
    tone: "direct",
    length: "shorter",
    structure,
    version: "strong"
  });

  state.cleanedText = cleanResult.text;
  state.cleanReport = cleanResult.report;
  state.versions.concise = conciseResult.text;
  state.versions.natural = naturalResult.text;
  state.versions.direct = directResult.text;
  state.revisedText = naturalResult.text;
  state.revisionReport = naturalResult.report;
  state.lastAction = "versions";

  els.versionConcise.textContent = conciseResult.text;
  els.versionNatural.textContent = naturalResult.text;
  els.versionDirect.textContent = directResult.text;
  els.versionsPanel.classList.remove("hidden");

  els.output.value = naturalResult.text;

  renderImpact(naturalResult.report);
  renderImprovements(naturalResult.report);
  renderChangePreview(naturalResult.report.previewItems);
  updateCounts();
}

function getOptions() {
  return {
    tone: getSelectedValue(els.toneSelect, "natural"),
    length: getSelectedValue(els.lengthSelect, "similar"),
    structure: getSelectedValue(els.structureSelect, "preserve"),
    version: normalizeVersion(getSelectedValue(els.versionSelect, "balanced"))
  };
}

function getSelectedValue(control, fallback) {
  return control && control.value ? control.value : fallback;
}

function normalizeVersion(value) {
  if (value === "concise") return "light";
  if (value === "natural") return "balanced";
  if (value === "direct") return "strong";
  return value || "balanced";
}

function runCleanPipeline(text) {
  const cleaned = cleanText(text);

  return {
    text: cleaned,
    report: buildCleanReport(text, cleaned)
  };
}

function runRevisionPipeline(text, options) {
  const revised = reviseText(text, options);

  return {
    text: revised,
    report: buildRevisionReport(text, revised, options)
  };
}

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
    output = output.replace(regex, (match) => matchCase(to, match));
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
  if (version === "light") {
    return text
      .replace(/\bkind of\b/gi, "somewhat")
      .replace(/\bsort of\b/gi, "somewhat");
  }

  if (version === "strong") {
    return text
      .replace(/\bI think that\s+/gi, "")
      .replace(/\bI believe that\s+/gi, "")
      .replace(/\bperhaps\s+/gi, "")
      .replace(/\bmaybe\s+/gi, "")
      .replace(/\bjust\s+/gi, "")
      .replace(/\bvery\s+/gi, "")
      .replace(/\breally\s+/gi, "")
      .replace(/\boverall\s+/gi, "");
  }

  return text
    .replace(/\bvery\s+/gi, "")
    .replace(/\breally\s+/gi, "")
    .replace(/\bin many different ways\b/gi, "in many ways");
}

function applyLength(text, length) {
  if (length === "shorter") return shortenText(text);
  if (length === "expand") return expandSlightly(text);
  return text;
}

function shortenText(text) {
  return text
    .replace(/\bthat is designed to\b/gi, "that")
    .replace(/\bwhich is intended to\b/gi, "to")
    .replace(/\bin a way that\b/gi, "so")
    .replace(/\bfor the reason that\b/gi, "because")
    .replace(/\bwith the goal of\b/gi, "to")
    .replace(/\bat the present time\b/gi, "now")
    .replace(/\bin the near future\b/gi, "soon");
}

function expandSlightly(text) {
  const sentences = splitSentences(text);

  if (sentences.length <= 1 && getWords(text).length > 12) {
    return `${text} This makes the message easier to understand without changing its meaning.`;
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

  return {
    chars: text.length,
    words: words.length,
    sentences: sentences.length,
    paragraphs: countParagraphs(text),
    readTime: estimateReadTime(words.length),
    longSentences,
    fillerCount,
    formalWords,
    repeatedWords: findRepeatedWords(words)
  };
}

function buildCleanReport(original, cleaned) {
  const changes = [];

  addChangeIf(changes, hasNbsp(original), {
    type: "formatting",
    label: "Converted non-breaking spaces",
    before: "non-breaking spaces",
    after: "regular spaces",
    reason: "Prevents awkward spacing when text is pasted elsewhere."
  });

  addChangeIf(changes, hasHiddenCharacters(original), {
    type: "formatting",
    label: "Removed hidden characters",
    before: "hidden characters",
    after: "removed",
    reason: "Removes invisible characters that can break formatting."
  });

  addChangeIf(changes, /[“”‘’]/.test(original), {
    type: "punctuation",
    label: "Normalized curly quotes",
    before: "curly quotes",
    after: "straight quotes",
    reason: "Makes pasted text more predictable across systems."
  });

  addChangeIf(changes, /[–—]/.test(original), {
    type: "punctuation",
    label: "Normalized long dashes",
    before: "long dashes",
    after: "hyphens",
    reason: "Improves compatibility in plain-text fields."
  });

  addChangeIf(changes, /[ \t]{2,}/.test(original), {
    type: "spacing",
    label: "Fixed extra spacing",
    before: "extra spaces",
    after: "single spaces",
    reason: "Makes the text cleaner and easier to scan."
  });

  addChangeIf(changes, /\n{3,}/.test(original), {
    type: "spacing",
    label: "Reduced extra line breaks",
    before: "large blank gaps",
    after: "clean paragraph spacing",
    reason: "Improves readability without rewriting the text."
  });

  addChangeIf(changes, /\s+([,.!?;:])/.test(original), {
    type: "punctuation",
    label: "Fixed spacing before punctuation",
    before: "space before punctuation",
    after: "standard punctuation spacing",
    reason: "Removes pasted-text artifacts."
  });

  const impactItems = [];

  if (changes.length) {
    impactItems.push(`Cleaned ${changes.length} formatting issue${plural(changes.length)}.`);
  }

  if (!impactItems.length && original !== cleaned) {
    impactItems.push("Cleaned minor spacing and punctuation issues.");
  }

  if (!impactItems.length) {
    impactItems.push("No major cleanup needed. The text already looked clean.");
  }

  return {
    mode: "clean",
    impactItems,
    changes,
    previewItems: buildPreviewItemsFromChanges(changes)
  };
}

function buildRevisionReport(original, revised, options) {
  const originalAnalysis = analyzeText(original);
  const revisedAnalysis = analyzeText(revised);

  const changes = [];
  const impactItems = [];

  const fillerRemoved = Math.max(0, originalAnalysis.fillerCount - revisedAnalysis.fillerCount);
  const formalSimplified = countSimplifiedWords(original, revised);
  const longSentenceReduction = Math.max(0, originalAnalysis.longSentences - revisedAnalysis.longSentences);
  const charReduction = Math.max(0, original.length - revised.length);

  if (fillerRemoved > 0) impactItems.push(`Removed ${fillerRemoved} filler phrase${plural(fillerRemoved)}.`);
  if (formalSimplified > 0) impactItems.push(`Simplified ${formalSimplified} word or phrase choice${plural(formalSimplified)}.`);
  if (longSentenceReduction > 0) impactItems.push(`Reduced ${longSentenceReduction} long sentence${plural(longSentenceReduction)}.`);
  if (charReduction > 20) impactItems.push(`Trimmed about ${charReduction} characters.`);
  if (options.structure === "reflow") impactItems.push("Reflowed text into a smoother paragraph structure.");

  const versionInfo = VERSION_RULES[options.version] || VERSION_RULES.balanced;
  impactItems.push(`${versionInfo.label}: ${versionInfo.reason}`);

  changes.push(...buildKnownTransformChanges(original, revised));

  if (!changes.length && original !== revised) {
    changes.push({
      type: "flow",
      label: "Improved flow",
      before: "original phrasing",
      after: "cleaner phrasing",
      reason: "The revision adjusted rhythm, spacing, or sentence flow."
    });
  }

  return {
    mode: "revision",
    impactItems,
    changes,
    previewItems: buildPreviewItemsFromChanges(changes)
  };
}

function buildKnownTransformChanges(original, revised) {
  const changes = [];
  const originalLower = original.toLowerCase();
  const revisedLower = revised.toLowerCase();

  FILLER_PHRASES.forEach((phrase) => {
    if (originalLower.includes(phrase) && !revisedLower.includes(phrase)) {
      changes.push({
        type: "removed",
        label: "Removed filler",
        before: phrase,
        after: "removed",
        reason: "Cuts unnecessary setup so the point arrives faster."
      });
    }
  });

  Object.entries(WORD_REPLACEMENTS).forEach(([from, to]) => {
    if (originalLower.includes(from.toLowerCase()) && revisedLower.includes(to.toLowerCase())) {
      changes.push({
        type: "replaced",
        label: "Simplified wording",
        before: from,
        after: to,
        reason: "Uses clearer wording while preserving meaning."
      });
    }
  });

  return changes;
}

function buildPreviewItemsFromChanges(changes) {
  return changes.slice(0, 8).map((change) => ({
    type: change.type,
    before: change.before,
    after: change.after,
    reason: change.reason
  }));
}

function buildImprovementSummary(report) {
  const improvements = [];

  if (!report || !report.impactItems) return ["No improvements yet."];

  report.impactItems.forEach((item) => {
    if (item.includes("Cleaned")) improvements.push("The text is cleaner and easier to paste into other tools.");
    if (item.includes("filler")) improvements.push("Your writing gets to the point faster.");
    if (item.includes("Simplified")) improvements.push("Your wording is clearer and easier to understand.");
    if (item.includes("Reduced") || item.includes("Trimmed")) improvements.push("The text is tighter and easier to scan.");
    if (item.includes("Reflowed")) improvements.push("The structure now reads more smoothly.");
    if (item.includes("Balanced revision")) improvements.push("The draft keeps your meaning while improving flow.");
    if (item.includes("Light revision")) improvements.push("The draft stays close to the original with restrained edits.");
    if (item.includes("Stronger revision")) improvements.push("The draft reads more directly without becoming a rewrite.");
  });

  if (!improvements.length) {
    improvements.push("Your text was already clear. Only minor refinements were needed.");
  }

  return [...new Set(improvements)];
}

function updateAnalysis() {
  const text = els.input.value.trim();

  if (!text) {
    renderList(els.analysisList, ["Paste text to see a quick readability check."]);
    return;
  }

  const analysis = analyzeText(text);
  const items = [
    `${analysis.words} word${plural(analysis.words)}.`,
    `${analysis.sentences} sentence${plural(analysis.sentences)}.`,
    `${analysis.paragraphs} paragraph${plural(analysis.paragraphs)}.`,
    `Estimated read time: ${analysis.readTime}.`
  ];

  if (analysis.longSentences > 0) items.push(`${analysis.longSentences} long sentence${plural(analysis.longSentences)} could be easier to scan.`);
  if (analysis.fillerCount > 0) items.push(`${analysis.fillerCount} filler phrase${plural(analysis.fillerCount)} may slow the writing down.`);
  if (analysis.formalWords > 0) items.push(`${analysis.formalWords} formal word or phrase choice${plural(analysis.formalWords)} could be simpler.`);
  if (analysis.repeatedWords.length > 0) items.push(`Repeated wording found: ${analysis.repeatedWords.slice(0, 3).join(", ")}.`);

  if (items.length <= 4) {
    items.push("This text is already fairly clean. A light revision may still improve flow.");
  }

  renderList(els.analysisList, items);
}

function renderImpact(report) {
  renderList(els.impactList, report.impactItems);
}

function renderImprovements(report) {
  renderList(els.improvementList, buildImprovementSummary(report));
}

function renderChangePreview(items) {
  if (!items.length) {
    els.changePreview.textContent = "No obvious word-level edits to show. The improvement was mostly spacing, structure, or flow.";
    return;
  }

  els.changePreview.innerHTML = items.map((item) => {
    const reason = item.reason ? `<small>${escapeHtml(item.reason)}</small>` : "";

    if (item.type === "removed" || item.after === "removed") {
      return `
        <div class="change-row">
          <span class="removed-text">${escapeHtml(item.before)}</span>
          <span class="arrow">→</span>
          <span class="muted-text">removed</span>
          ${reason}
        </div>
      `;
    }

    return `
      <div class="change-row">
        <span class="removed-text">${escapeHtml(item.before)}</span>
        <span class="arrow">→</span>
        <span class="added-text">${escapeHtml(item.after)}</span>
        ${reason}
      </div>
    `;
  }).join("");
}

function renderList(listEl, items) {
  if (!listEl) return;
  listEl.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function updateCounts() {
  updateTextStats(els.input.value, els.inputCharCount, els.inputWordCount);
  updateTextStats(els.output.value, els.outputCharCount, els.outputWordCount);
}

function updateTextStats(text, charEl, wordEl) {
  const chars = text.length;
  const words = getWords(text).length;

  if (charEl) charEl.textContent = `${chars} char${plural(chars)}`;
  if (wordEl) wordEl.textContent = `${words} word${plural(words)}`;
}

async function copyOutput() {
  const text = els.output.value.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showCopySuccess();
  } catch {
    els.output.select();
    document.execCommand("copy");
    showCopySuccess();
  }
}

function showCopySuccess() {
  els.copyBtn.textContent = "Copied";

  setTimeout(() => {
    els.copyBtn.textContent = "Copy Output";
  }, 1200);
}

function clearAll() {
  state.inputText = "";
  state.cleanedText = "";
  state.revisedText = "";
  state.cleanReport = null;
  state.revisionReport = null;
  state.lastAction = null;
  state.versions.concise = "";
  state.versions.natural = "";
  state.versions.direct = "";

  els.input.value = "";
  els.output.value = "";
  els.versionConcise.textContent = "";
  els.versionNatural.textContent = "";
  els.versionDirect.textContent = "";
  els.versionsPanel.classList.add("hidden");

  els.changePreview.textContent = "Paste text and click Clean Text or Create SecondDraft to see visible changes.";

  renderList(els.analysisList, ["Paste text to see a quick readability check."]);
  renderList(els.impactList, ["No changes yet."]);
  renderList(els.improvementList, ["No improvements yet."]);
  updateCounts();
}

function showEmptyState() {
  renderList(els.analysisList, ["Paste text first, then choose Clean Text or Create SecondDraft."]);
}

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

function countParagraphs(text) {
  if (!text.trim()) return 0;

  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length || 1;
}

function estimateReadTime(wordCount) {
  if (wordCount === 0) return "0 min";
  const minutes = Math.max(1, Math.ceil(wordCount / 225));
  return `${minutes} min`;
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

function countSimplifiedWords(original, revised) {
  const originalLower = original.toLowerCase();
  const revisedLower = revised.toLowerCase();

  return Object.entries(WORD_REPLACEMENTS).reduce((count, [from, to]) => {
    const hadOriginal = countMatches(originalLower, from.toLowerCase()) > 0;
    const hasReplacement = countMatches(revisedLower, to.toLowerCase()) > 0;
    return hadOriginal && hasReplacement ? count + 1 : count;
  }, 0);
}

function addChangeIf(list, condition, change) {
  if (condition) list.push(change);
}

function hasNbsp(text) {
  return /\u00A0/.test(text);
}

function hasHiddenCharacters(text) {
  return /[\u200B-\u200D\uFEFF]/.test(text);
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

  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }

  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}
