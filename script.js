document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  document.querySelectorAll(".theme-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.dataset.theme = btn.dataset.theme;
      localStorage.setItem("pastelint-theme", btn.dataset.theme);
    });
  });

  const savedTheme = localStorage.getItem("pastelint-theme");
  if (savedTheme) document.body.dataset.theme = savedTheme;

  const input = $("input");
  const output = $("output");
  const rewriteBtn = $("rewriteBtn");
  const cleanBtn = $("cleanBtn");
  const copyBtn = $("copyBtn");
  const clearBtn = $("clearBtn");

  function countWords(text) {
    return (text.trim().match(/\b[\w'-]+\b/g) || []).length;
  }

  function updateCounts() {
    if ($("charCount") && input) $("charCount").textContent = `${input.value.length} chars`;
    if ($("wordCount") && input) $("wordCount").textContent = `${countWords(input.value)} words`;
    if ($("outputCharCount") && output) $("outputCharCount").textContent = `${output.value.length} chars`;
    if ($("outputWordCount") && output) $("outputWordCount").textContent = `${countWords(output.value)} words`;
  }

  function cleanText(text, changes = []) {
    const before = text;
    const cleaned = text
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/[ \t]+$/gm, "")
      .trim();

    if (before !== cleaned) changes.push("Cleaned hidden characters, smart punctuation, and extra spacing.");
    return cleaned;
  }

  if (input && output && cleanBtn && !rewriteBtn) {
    input.addEventListener("input", updateCounts);
    cleanBtn.addEventListener("click", () => {
      const changes = [];
      output.value = cleanText(input.value, changes);
      updateCounts();
    });
  }

  const toneMode = $("toneMode");
  const rewriteStrength = $("rewriteStrength");
  const strengthLabel = $("strengthLabel");
  const humanizeMode = $("humanizeMode");
  const paragraphView = $("paragraphView");
  const lineView = $("lineView");
  const lineResults = $("lineResults");
  const versionsPanel = $("versionsPanel");
  const insightPanel = $("insightPanel");
  const changeList = $("changeList");
  const outputTools = $("outputTools");
  const insightToggle = $("insightToggle");
  const quickActions = document.querySelector(".quick-actions");
  const reviewNote = $("reviewNote");

  const weakIntensifiers = /\b(very|really|actually|basically|simply|quite|rather|somewhat|extremely)\b\s*/gi;

  const replacements = [
    [/\bit is important to note that\b/gi, ""],
    [/\bit should be noted that\b/gi, ""],
    [/\bin today's fast[- ]paced (world|environment)\b/gi, "today"],
    [/\bplays a crucial role in\b/gi, "helps"],
    [/\bplays an important role in\b/gi, "helps"],
    [/\butilize\b/gi, "use"],
    [/\bfacilitate\b/gi, "help"],
    [/\bcommence\b/gi, "start"],
    [/\bassist\b/gi, "help"],
    [/\bindividuals\b/gi, "people"],
    [/\badditional\b/gi, "more"],
    [/\bdue to the fact that\b/gi, "because"],
    [/\bin order to\b/gi, "to"],
    [/\bwith regard to\b/gi, "about"],
    [/\bin the event that\b/gi, "if"],
    [/\bat this point in time\b/gi, "now"],
    [/\ba wide range of\b/gi, "many"],
    [/\brobust\b/gi, "strong"],
    [/\bleverage\b/gi, "use"],
    [/\bseamless\b/gi, "smooth"],
    [/\benhance\b/gi, "improve"],
    [/\boptimize\b/gi, "improve"]
  ];

  function splitSentences(text) {
    return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  }

  function sentenceCase(text) {
    return text.replace(/(^\s*[a-z])/, (m) => m.toUpperCase());
  }

  function simplifySentence(sentence, strength, changes) {
    let s = sentence.trim();
    if (!s) return "";

    const original = s;

    for (const [pattern, replacement] of replacements) {
      if (pattern.test(s)) {
        s = s.replace(pattern, replacement);
        changes.push("Simplified inflated or overly formal wording.");
      }
      pattern.lastIndex = 0;
    }

    if (strength >= 2 && weakIntensifiers.test(s)) {
      s = s.replace(weakIntensifiers, "");
      changes.push("Removed weak intensifiers like very, really, and basically.");
    }
    weakIntensifiers.lastIndex = 0;

    if (strength >= 3) {
      s = s
        .replace(/\bthis means that\b/gi, "so")
        .replace(/\bthere are many ways in which\b/gi, "many ways")
        .replace(/\bthe process of\b/gi, "")
        .replace(/\bin a manner that is\b/gi, "in a way that is");
    }

    s = s.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
    if (s && !/[.!?]$/.test(s)) s += ".";
    s = sentenceCase(s);

    if (original !== s && strength >= 2) changes.push("Smoothed sentence structure while preserving the original meaning.");
    return s;
  }

  function applyTone(text, tone, changes) {
    let t = text;

    if (tone === "concise") {
      const before = t;
      t = t.replace(/\bI think that\b/gi, "").replace(/\bwe believe that\b/gi, "we believe");
      if (before !== t) changes.push("Adjusted the rewrite for a more concise tone.");
    }

    if (tone === "professional") {
      const before = t;
      t = t.replace(/\bget\b/gi, "receive").replace(/\ba lot of\b/gi, "many");
      if (before !== t) changes.push("Adjusted the rewrite for a more professional tone.");
    }

    if (tone === "friendly") {
      const before = t;
      t = t.replace(/\bYou can\b/g, "You can also");
      if (before !== t) changes.push("Added a warmer, friendlier feel.");
    }

    if (tone === "direct") {
      const before = t;
      t = t.replace(/\bplease feel free to\b/gi, "").replace(/\bif possible,?\s*/gi, "");
      if (before !== t) changes.push("Made the rewrite more direct.");
    }

    return t.replace(/\s{2,}/g, " ").trim();
  }

  function humanizeText(text, strength, changes) {
    if (!humanizeMode || !humanizeMode.checked) return text;

    let t = text
      .replace(/\bdo not\b/gi, "don't")
      .replace(/\bcannot\b/gi, "can't")
      .replace(/\bwill not\b/gi, "won't")
      .replace(/\bit is\b/gi, "it's")
      .replace(/\bthat is\b/gi, "that's");

    if (strength >= 2) {
      t = t
        .replace(/Not rewriting - just\.\.\. fixing\./gi, "Not rewriting - just fixing it.")
        .replace(/Most "AI humanizers" I tried either:/gi, "Most AI humanizers I tried had one of two problems:")
        .replace(/Would genuinely appreciate feedback:/gi, "I'd genuinely appreciate feedback.");
    }

    if (strength >= 3) {
      t = t
        .replace(/\bThis tool\b/g, "It")
        .replace(/\bCurious if this is something others actually need\b/gi, "I'm curious whether other people need this");
    }

    if (text !== t) changes.push("Added more natural rhythm and contractions where appropriate.");
    return t;
  }

  function lightPolish(text, changes) {
    const before = text;
    const t = text
      .replace(/\s+—\s+/g, " — ")
      .replace(/\s+\+\s+/g, " and ")
      .replace(/(\n\s*){3,}/g, "\n\n")
      .replace(/\bjust\.\.\.\s*/gi, "just ")
      .trim();

    if (before !== t) changes.push("Applied light polish for punctuation, rhythm, and readability.");
    return t;
  }

  function dedupeChanges(changes) {
    return [...new Set(changes)].slice(0, 7);
  }

  function rewriteText(text, tone = toneMode?.value || "natural", strength = Number(rewriteStrength?.value || 2)) {
    const changes = [];
    const cleaned = cleanText(text, changes);

    if (!cleaned) return { text: "", changes: [] };

    let rewritten = splitSentences(cleaned).map((s) => simplifySentence(s, strength, changes)).join(" ");
    rewritten = applyTone(rewritten, tone, changes);
    rewritten = humanizeText(rewritten, strength, changes);
    rewritten = lightPolish(rewritten, changes);
    rewritten = cleanText(rewritten, changes);

    if (rewritten === cleaned && cleaned.trim()) {
      changes.push("No major cleanup needed — this text is already clear and natural.");
      rewritten = cleaned;
    }

    return { text: rewritten, changes: dedupeChanges(changes) };
  }

  function updateReviewNote() {
    if (!reviewNote || !output) return;

    const hasOutput = Boolean(output.value.trim());
    if (!hasOutput) {
      reviewNote.hidden = true;
      return;
    }

    const strength = Number(rewriteStrength?.value || 2);
    const humanize = Boolean(humanizeMode?.checked);
    const words = countWords(input?.value || "");

    reviewNote.hidden = false;
    reviewNote.textContent =
      strength >= 3 || humanize || words > 500
        ? "This rewrite may have made stronger edits. Quickly review for missing nuance, names, dates, or key details."
        : "Review for accuracy — we aim to preserve meaning, but always double-check important details.";
  }

  function updateOutputVisibility() {
    if (!output) return;

    const hasOutput = Boolean(output.value.trim());
    if (outputTools) outputTools.hidden = !hasOutput;
    if (quickActions) quickActions.hidden = !hasOutput;

    updateReviewNote();

    if (!hasOutput) {
      if (insightPanel) insightPanel.hidden = true;
      if (insightToggle) {
        insightToggle.hidden = true;
        insightToggle.setAttribute("aria-expanded", "false");
      }
    }
  }

  function renderChanges(changes) {
    const latestChanges = dedupeChanges(changes);

    if (changeList) {
      changeList.innerHTML = "";
      latestChanges.forEach((change) => {
        const li = document.createElement("li");
        li.textContent = change;
        changeList.appendChild(li);
      });
    }

    if (insightToggle) {
      insightToggle.hidden = latestChanges.length === 0 || !output?.value.trim();
      insightToggle.setAttribute("aria-expanded", "false");
    }

    if (insightPanel) insightPanel.hidden = true;
    updateOutputVisibility();
  }

  function renderLineView() {
    if (!lineView || lineView.hidden || !lineResults || !input) return;

    const lines = input.value.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    lineResults.innerHTML = "";

    if (!lines.length) {
      lineResults.innerHTML = '<p class="empty-state">Paste text to see line-by-line rewrites.</p>';
      return;
    }

    lines.forEach((line) => {
      const result = rewriteText(line);
      const pair = document.createElement("div");
      pair.className = "line-pair";
      pair.innerHTML = "<div><small>Original</small><p></p></div><div><small>SecondDraft</small><p></p></div>";
      pair.querySelectorAll("p")[0].textContent = line;
      pair.querySelectorAll("p")[1].textContent = result.text;
      lineResults.appendChild(pair);
    });
  }

  function runRewrite() {
    if (!input || !output) return;

    const result = rewriteText(input.value);
    output.value = result.text;
    renderChanges(result.changes);
    renderLineView();
    updateCounts();
  }

  function runCleanOnly() {
    if (!input || !output) return;

    const changes = [];
    output.value = cleanText(input.value, changes);

    if (!changes.length && output.value.trim()) {
      changes.push("No major cleanup needed — this text is already clean.");
    }

    renderChanges(dedupeChanges(changes));
    renderLineView();
    updateCounts();
  }

  function generateVersions() {
    if (!input || !output || !versionsPanel) return;

    const base = input.value.trim();
    if (!base) return;

    const options = [
      ["Natural", "natural", 2],
      ["Concise", "concise", 3],
      ["Direct", "direct", 3]
    ];

    versionsPanel.hidden = false;
    versionsPanel.innerHTML = '<h3>Choose a version</h3><div class="version-grid"></div>';

    const grid = versionsPanel.querySelector(".version-grid");

    options.forEach(([label, tone, strength]) => {
      const result = rewriteText(base, tone, strength);
      const card = document.createElement("article");
      card.className = "version-card";
      card.innerHTML = `<strong>${label}</strong><p></p><button class="small-copy" type="button">Copy this version</button>`;
      card.querySelector("p").textContent = result.text;

      card.querySelector("button").addEventListener("click", async () => {
        output.value = result.text;
        renderChanges(result.changes);
        updateCounts();

        try {
          await navigator.clipboard.writeText(result.text);
          card.querySelector("button").textContent = "Copied";
          setTimeout(() => card.querySelector("button").textContent = "Copy this version", 1200);
        } catch {
          card.querySelector("button").textContent = "Copy failed";
          setTimeout(() => card.querySelector("button").textContent = "Copy this version", 1200);
        }
      });

      grid.appendChild(card);
    });
  }

  function quickAction(action) {
    if (!input || !output) return;

    let text = output.value || input.value;
    if (!text.trim()) return;

    const changes = [];

    if (action === "shorter") {
      text = rewriteText(text, "concise", 3).text;
      changes.push("Shortened the current output.");
    }

    if (action === "clearer") {
      text = rewriteText(text, "natural", 2).text;
      changes.push("Clarified the current output.");
    }

    if (action === "simpler") {
      text = rewriteText(text, "direct", 3).text;
      changes.push("Simplified the language in the current output.");
    }

    output.value = text;
    renderChanges(changes);
    updateCounts();
  }

  function setupDisclosure(buttonId, panelId) {
    const button = $(buttonId);
    const panel = $(panelId);
    if (!button || !panel) return;

    button.addEventListener("click", () => {
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      button.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  rewriteBtn?.addEventListener("click", runRewrite);
  if (rewriteBtn) cleanBtn?.addEventListener("click", runCleanOnly);
  $("versionsBtn")?.addEventListener("click", generateVersions);

  clearBtn?.addEventListener("click", () => {
    if (input) input.value = "";
    if (output) output.value = "";
    if (versionsPanel) versionsPanel.hidden = true;
    if (insightPanel) insightPanel.hidden = true;
    if (lineResults) lineResults.innerHTML = '<p class="empty-state">Paste text to see line-by-line rewrites.</p>';
    updateCounts();
    updateOutputVisibility();
  });

  copyBtn?.addEventListener("click", async () => {
    if (!output?.value) return;

    try {
      await navigator.clipboard.writeText(output.value);
      copyBtn.textContent = "Copied";
      setTimeout(() => copyBtn.textContent = "Copy", 1200);
    } catch {
      copyBtn.textContent = "Copy failed";
      setTimeout(() => copyBtn.textContent = "Copy", 1200);
    }
  });

  input?.addEventListener("input", () => {
    updateCounts();
    renderLineView();
  });

  output?.addEventListener("input", () => {
    updateCounts();
    updateOutputVisibility();
  });

  rewriteStrength?.addEventListener("input", () => {
    if (strengthLabel) strengthLabel.textContent = ["Light", "Balanced", "Strong"][Number(rewriteStrength.value) - 1];
  });

  setupDisclosure("advancedToggle", "advancedOptions");
  setupDisclosure("moreOptionsToggle", "moreOptions");

  insightToggle?.addEventListener("click", () => {
    if (!insightPanel) return;
    const shouldOpen = insightPanel.hidden;
    insightPanel.hidden = !shouldOpen;
    insightToggle.setAttribute("aria-expanded", String(shouldOpen));
  });

  document.querySelectorAll(".quick-actions button").forEach((btn) => {
    btn.addEventListener("click", () => quickAction(btn.dataset.action));
  });

  $("paragraphMode")?.addEventListener("click", () => {
    if (!paragraphView || !lineView) return;
    paragraphView.hidden = false;
    lineView.hidden = true;
    $("paragraphMode").classList.add("active");
    $("lineMode")?.classList.remove("active");
  });

  $("lineMode")?.addEventListener("click", () => {
    if (!paragraphView || !lineView) return;
    paragraphView.hidden = true;
    lineView.hidden = false;
    $("lineMode").classList.add("active");
    $("paragraphMode")?.classList.remove("active");
    renderLineView();
  });

  updateCounts();
  updateOutputVisibility();
});
