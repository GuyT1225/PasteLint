document.addEventListener("DOMContentLoaded", () => {
  const els = getElements();
  bindEvents(els);
  updateCounters(els);
});

/* -----------------------------
   ELEMENTS
----------------------------- */

function $(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}
function getElements() {
  return {
    input: $("inputText", "input"),
    output: $("outputText", "output"),

    cleanBtn: $("cleanBtn"),
    rewriteBtn: $("improveBtn", "rewriteBtn"),
    versionsBtn: $("versionsBtn"),

    copyBtn: $("copyBtn"),
    clearBtn: $("clearBtn"),

    inputCharCount: $("inputCharCount"),
    inputWordCount: $("inputWordCount"),
    outputCharCount: $("outputCharCount"),
    outputWordCount: $("outputWordCount"),

    modeToggle: $("modeToggle"),

    // INSIGHTS (aligned to your HTML)
    issuePanel: $("analysisList"),
    impactPanel: $("impactList"),
    changeSummary: $("improvementList"),

    // CHANGE PREVIEW (future use)
    changePreview: $("changePreview"),

    // VERSIONS
    versionsPanel: $("versionsPanel"),
    version1: $("versionConcise"),
    version2: $("versionNatural"),
    version3: $("versionDirect")
  };
}
/* -----------------------------
   EVENTS
----------------------------- */

function bindEvents(els) {
  els.input?.addEventListener("input", () => {
    updateCounters(els);
    runPreAnalysis(els);
  });

  els.cleanBtn?.addEventListener("click", () => handleClean(els));
  els.rewriteBtn?.addEventListener("click", () => handleRewrite(els));
  els.copyBtn?.addEventListener("click", () => copyOutput(els));
  els.clearBtn?.addEventListener("click", () => clearAll(els));

  els.versionsBtn?.addEventListener("click", () => {
    handleRewrite(els);

    if (els.versionsPanel) {
      els.versionsPanel.classList.remove("hidden");
    }
  });
}

/* -----------------------------
   SAFE TYPO SUPPORT
----------------------------- */

const COMMON_TYPOS = {
  teh: "the",
  adn: "and",
  recieve: "receive",
  recieved: "received",
  recieving: "receiving",
  seperate: "separate",
  definately: "definitely",
  occured: "occurred",
  occuring: "occurring",
  untill: "until",
  becuase: "because",
  taht: "that",
  wich: "which",
  thier: "their",
  beleive: "believe",
  acheive: "achieve",
  accomodate: "accommodate",
  adress: "address",
  enviroment: "environment",
  goverment: "government",
  calender: "calendar",
  tommorow: "tomorrow",
  yesturday: "yesterday",
  alot: "a lot"
};

function fixCommonTypos(text) {
  let count = 0;

  const fixed = text.replace(/\b[A-Za-z']+\b/g, word => {
    const lower = word.toLowerCase();
    const replacement = COMMON_TYPOS[lower];

    if (!replacement) return word;

    count++;

    if (word === word.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (word[0] === word[0].toUpperCase()) {
      return capitalize(replacement);
    }

    return replacement;
  });

  return { text: fixed, count };
}

function fixRepeatedWords(text) {
  let count = 0;

  const fixed = text.replace(/\b(\w+)\s+\1\b/gi, (match, word) => {
    count++;
    return word;
  });

  return { text: fixed, count };
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* -----------------------------
   PRE-ANALYSIS
----------------------------- */

function runPreAnalysis(els) {
  const text = getInputText(els);

  if (!text) {
    if (els.issuePanel) els.issuePanel.textContent = "";
    return;
  }

  const issues = detectIssues(text);

  if (els.issuePanel) {
    els.issuePanel.textContent = issues.length
      ? issues.map(issue => `• ${issue}`).join("\n")
      : "No obvious issues detected";
  }
}

function detectIssues(text) {
  const issues = [];
  const sentences = text.split(/[.!?]/).filter(Boolean);

  if (sentences.some(sentence => sentence.trim().split(/\s+/).length > 25)) {
    issues.push("Some sentences are too long");
  }

  if (/(very|really|basically|actually)/i.test(text)) {
    issues.push("Contains filler words");
  }

  if (hasRepetition(text)) {
    issues.push("Repeated words detected");
  }

  if (hasCommonTypos(text)) {
    issues.push("Possible common typos detected");
  }

  if (/(utilize|assistance|facilitate)/i.test(text)) {
    issues.push("Overly formal wording");
  }

  return issues;
}

function hasCommonTypos(text) {
  return Object.keys(COMMON_TYPOS).some(typo => {
    const pattern = new RegExp(`\\b${escapeRegExp(typo)}\\b`, "i");
    return pattern.test(text);
  });
}

function hasRepetition(text) {
  return /\b(\w+)\s+\1\b/i.test(text);
}

/* -----------------------------
   CLEAN
----------------------------- */

function handleClean(els) {
  const raw = getInputText(els);
  if (!raw) return;

  const mode = getCleanMode(els);
  const result = cleanText(raw, mode);

  setOutput(els, result.text);
  renderImpact(els, result.impact);
  renderChanges(els, result.changes);
  updateCounters(els);
}

/* -----------------------------
   REWRITE
----------------------------- */

function handleRewrite(els) {
  const source = getSourceForRewrite(els);
  if (!source) return;

  const versions = generateVersions(source);

  setOutput(els, versions[0].text);
  renderVersions(els, versions);
  renderImpact(els, versions[0].impact);
  renderChanges(els, versions[0].changes);
  updateCounters(els);
}

/* -----------------------------
   CLEAN ENGINE
----------------------------- */

function cleanText(text, mode = "paragraph") {
  let cleaned = text;

  const impact = {
    spaces: 0,
    lines: 0,
    punctuation: 0,
    typos: 0,
    repeatedWords: 0
  };

  cleaned = cleaned.replace(/[ \t]{2,}/g, () => {
    impact.spaces++;
    return " ";
  });

  cleaned = cleaned.replace(/\n{3,}/g, () => {
    impact.lines++;
    return "\n\n";
  });

  cleaned = cleaned.replace(/\s+([,.;!?])/g, (match, punctuation) => {
    impact.punctuation++;
    return punctuation;
  });

  const typoResult = fixCommonTypos(cleaned);
  cleaned = typoResult.text;
  impact.typos = typoResult.count;

  const repeatedWordResult = fixRepeatedWords(cleaned);
  cleaned = repeatedWordResult.text;
  impact.repeatedWords = repeatedWordResult.count;

  cleaned = applyCleanMode(cleaned, mode);

  return {
    text: cleaned.trim(),
    impact,
    changes: [
      impact.spaces && "Collapsed extra spaces",
      impact.lines && "Reduced excessive line breaks",
      impact.punctuation && "Fixed punctuation spacing",
      impact.typos && `Fixed ${impact.typos} common typo${impact.typos === 1 ? "" : "s"}`,
      impact.repeatedWords && `Removed ${impact.repeatedWords} repeated word${impact.repeatedWords === 1 ? "" : "s"}`,
      mode === "line" && "Cleaned text line by line",
      mode === "paragraph" && "Cleaned text as paragraphs"
    ].filter(Boolean)
  };
}

function applyCleanMode(text, mode) {
  if (mode === "line") {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  return text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

/* -----------------------------
   REWRITE ENGINE
----------------------------- */

function generateVersions(text) {
  return [
    rewriteConcise(text),
    rewriteNatural(text),
    rewriteDirect(text)
  ];
}

function rewriteConcise(text) {
  let out = text;

  out = out.replace(/It is important to note that/gi, "");
  out = out.replace(/due to the fact that/gi, "because");
  out = out.replace(/in order to/gi, "to");
  out = out.replace(/for the purpose of/gi, "to");
  out = out.replace(/at this point in time/gi, "now");

  return buildResult("Concise", text, out);
}

function rewriteNatural(text) {
  let out = text;

  out = out.replace(/utilize/gi, "use");
  out = out.replace(/assistance/gi, "help");
  out = out.replace(/facilitate/gi, "help");
  out = out.replace(/with regard to/gi, "about");
  out = out.replace(/prior to/gi, "before");

  return buildResult("Natural", text, out);
}

function rewriteDirect(text) {
  let out = text;

  out = out.replace(/I would like to/gi, "");
  out = out.replace(/It seems that/gi, "");
  out = out.replace(/There is/gi, "");
  out = out.replace(/There are/gi, "");
  out = out.replace(/Please be advised that/gi, "");

  return buildResult("Direct", text, out);
}

/* -----------------------------
   RESULT BUILDER
----------------------------- */

function buildResult(label, original, revised) {
  const cleanedRevised = normalizeRewrite(revised);

  const impact = {
    shortened: Math.max(0, original.length - cleanedRevised.length)
  };

  return {
    label,
    text: cleanedRevised,
    changes: original !== cleanedRevised ? [`Created ${label.toLowerCase()} version`] : ["No major rewrite needed"],
    impact
  };
}

function normalizeRewrite(text) {
  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* -----------------------------
   IMPACT + CHANGE UI
----------------------------- */

function renderImpact(els, impact) {
  if (!els.impactPanel) return;

  const parts = [];

  if (impact.shortened > 0) {
    parts.push(`Shortened by ${impact.shortened} characters`);
  }

  if (impact.spaces) {
    parts.push("Removed extra spaces");
  }

  if (impact.lines) {
    parts.push("Reduced line breaks");
  }

  if (impact.punctuation) {
    parts.push("Fixed punctuation spacing");
  }

  if (impact.typos) {
    parts.push(`Fixed ${impact.typos} common typo${impact.typos === 1 ? "" : "s"}`);
  }

  if (impact.repeatedWords) {
    parts.push(`Removed ${impact.repeatedWords} repeated word${impact.repeatedWords === 1 ? "" : "s"}`);
  }

  els.impactPanel.textContent = parts.join(" • ") || "No major changes";
}

function renderChanges(els, changes) {
  if (!els.changeSummary) return;

  els.changeSummary.textContent = changes.length
    ? changes.join(" • ")
    : "No major cleanup needed";
}

/* -----------------------------
   VERSIONS
----------------------------- */

function renderVersions(els, versions) {
  const targets = [els.version1, els.version2, els.version3];

  versions.forEach((version, index) => {
    if (targets[index]) {
      targets[index].textContent = `${version.label}\n\n${version.text}`;
    }
  });
}

/* -----------------------------
   COUNTERS
----------------------------- */

function updateCounters(els) {
  const input = els.input?.value || "";
  const output = els.output?.value || "";

  setText(els.inputCharCount, `${input.length} chars`);
  setText(els.inputWordCount, `${countWords(input)} words`);
  setText(els.outputCharCount, `${output.length} chars`);
  setText(els.outputWordCount, `${countWords(output)} words`);
}

function countWords(text) {
  return (text.trim().match(/\b\w+\b/g) || []).length;
}

/* -----------------------------
   COPY + CLEAR
----------------------------- */

function copyOutput(els) {
  if (!els.output?.value) return;

  navigator.clipboard.writeText(els.output.value).catch(() => {
    els.output.select();
    document.execCommand("copy");
  });
}

function clearAll(els) {
  if (els.input) els.input.value = "";
  if (els.output) els.output.value = "";

  updateCounters(els);

  if (els.issuePanel) els.issuePanel.textContent = "";
  if (els.impactPanel) els.impactPanel.textContent = "";
  if (els.changeSummary) els.changeSummary.textContent = "";

  if (els.version1) els.version1.textContent = "";
  if (els.version2) els.version2.textContent = "";
  if (els.version3) els.version3.textContent = "";
}

/* -----------------------------
   HELPERS
----------------------------- */

function getInputText(els) {
  return els.input?.value.trim() || "";
}

function getSourceForRewrite(els) {
  return els.output?.value.trim() || getInputText(els);
}

function getCleanMode(els) {
  if (!els.modeToggle) return "paragraph";

  if (els.modeToggle.type === "checkbox") {
    return els.modeToggle.checked ? "line" : "paragraph";
  }

  return els.modeToggle.value === "line" ? "line" : "paragraph";
}

function setOutput(els, text) {
  if (els.output) els.output.value = text;
}

function setText(el, text) {
  if (el) el.textContent = text;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
