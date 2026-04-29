document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const savedTheme = localStorage.getItem("pastelint-theme");
  if (savedTheme) document.body.dataset.theme = savedTheme;

  document.querySelectorAll(".theme-toggle button").forEach((button) => {
    button.setAttribute("type", "button");
    button.addEventListener("click", () => {
      document.body.dataset.theme = button.dataset.theme;
      localStorage.setItem("pastelint-theme", button.dataset.theme);
    });
  });

  const input = $("input");
  const output = $("output");
  const cleanBtn = $("cleanBtn");
  const rewriteBtn = $("rewriteBtn");
  const copyBtn = $("copyBtn");
  const clearBtn = $("clearBtn");

  const replacements = [
    [/\bit is important to note that\b/gi, "", "Removed a common filler phrase."],
    [/\bit should be noted that\b/gi, "", "Removed a common filler phrase."],
    [/\bin today's fast[- ]paced (?:world|digital landscape),?\s*/gi, "", "Removed a generic AI-style opener."],
    [/\bplays a crucial role in\b/gi, "helps", "Replaced inflated wording with simpler language."],
    [/\bplays an important role in\b/gi, "helps", "Replaced inflated wording with simpler language."],
    [/\butilize\b/gi, "use", "Simplified inflated vocabulary."],
    [/\bfacilitate\b/gi, "help", "Simplified inflated vocabulary."],
    [/\bindividuals\b/gi, "people", "Made the wording more natural."],
    [/\bdue to the fact that\b/gi, "because", "Shortened a wordy phrase."],
    [/\bin order to\b/gi, "to", "Shortened a wordy phrase."],
    [/\bwith regard to\b/gi, "about", "Simplified a formal phrase."],
    [/\bleverage\b/gi, "use", "Simplified inflated vocabulary."],
    [/\benhance\b/gi, "improve", "Simplified inflated vocabulary."],
    [/\ba plethora of\b/gi, "many", "Simplified over-polished wording."],
    [/\bseamless\b/gi, "smooth", "Simplified over-polished wording."]
  ];

  function wordCount(text) {
    return ((text || "").trim().match(/\b[\w'-]+\b/g) || []).length;
  }

  function sentenceCount(text) {
    return ((text || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).filter((s) => s.trim()).length;
  }

  function unique(items) {
    return [...new Set(items.filter(Boolean))].slice(0, 10);
  }

  function updateCounts() {
    if ($("charCount") && input) $("charCount").textContent = `${input.value.length} chars`;
    if ($("wordCount") && input) $("wordCount").textContent = `${wordCount(input.value)} words`;
    if ($("outputCharCount") && output) $("outputCharCount").textContent = `${output.value.length} chars`;
    if ($("outputWordCount") && output) $("outputWordCount").textContent = `${wordCount(output.value)} words`;
  }

  function cleanText(text, changes = []) {
    const before = text || "";
    let cleaned = before
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, " - ")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/[ \t]+$/gm, "")
      .trim();

    cleaned = cleaned
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/([^.!?:;])\n(?=[a-z0-9])/gi, "$1 "))
      .join("\n\n");

    if (before !== cleaned) changes.push("Cleaned hidden characters, punctuation, spacing, or line breaks.");
    return cleaned;
  }

  function detectCleanupIssues(text) {
    const source = text || "";
    const issues = [];
    const count = (regex) => (source.match(regex) || []).length;

    const hidden = count(/[\u200B-\u200D\uFEFF]/g);
    const smartQuotes = count(/[“”‘’]/g);
    const longDashes = count(/[–—]/g);
    const extraSpaces = count(/[ \t]{2,}/g);
    const paragraphGaps = count(/\n{3,}/g);
    const trailingSpaces = count(/[ \t]+$/gm);

    if (hidden) issues.push(`${hidden} hidden Unicode character${hidden === 1 ? "" : "s"} removed`);
    if (smartQuotes) issues.push(`${smartQuotes} smart quote${smartQuotes === 1 ? "" : "s"} normalized`);
    if (longDashes) issues.push(`${longDashes} long dash${longDashes === 1 ? "" : "es"} converted`);
    if (extraSpaces) issues.push(`${extraSpaces} extra spacing issue${extraSpaces === 1 ? "" : "s"} cleaned`);
    if (paragraphGaps) issues.push(`${paragraphGaps} large paragraph gap${paragraphGaps === 1 ? "" : "s"} tightened`);
    if (trailingSpaces) issues.push(`${trailingSpaces} trailing space issue${trailingSpaces === 1 ? "" : "s"} removed`);
    if (/[&@#$%]/.test(source)) issues.push("IVR/TTS-sensitive symbols detected for review");

    return issues;
  }

  function diffTokens(original, revised) {
    const tokenize = (value) => (value || "").match(/\s+|[^\s]+/g) || [];
    const a = tokenize(original);
    const b = tokenize(revised);
    const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        rows[i][j] = a[i] === b[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1]);
      }
    }

    const pieces = [];
    let i = 0;
    let j = 0;
    let removed = 0;
    let added = 0;

    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        pieces.push({ type: "same", text: a[i] });
        i++;
        j++;
      } else if (rows[i + 1][j] >= rows[i][j + 1]) {
        pieces.push({ type: "removed", text: a[i] });
        if (!/^\s+$/.test(a[i])) removed++;
        i++;
      } else {
        pieces.push({ type: "added", text: b[j] });
        if (!/^\s+$/.test(b[j])) added++;
        j++;
      }
    }

    while (i < a.length) {
      pieces.push({ type: "removed", text: a[i] });
      if (!/^\s+$/.test(a[i])) removed++;
      i++;
    }

    while (j < b.length) {
      pieces.push({ type: "added", text: b[j] });
      if (!/^\s+$/.test(b[j])) added++;
      j++;
    }

    return { pieces, removed, added };
  }

  function renderHomepageDiff(original, revised) {
    const panel = $("diffPanel");
    const summary = $("diffSummary");
    const outputBox = $("diffOutput");
    const issueList = $("issueList");
    const status = $("diffStatus");

    if (!panel || !summary || !outputBox) return;

    const hasText = Boolean((original || "").trim() || (revised || "").trim());
    panel.hidden = !hasText;
    if (!hasText) return;

    const issues = detectCleanupIssues(original);
    const diff = diffTokens(original, revised);

    summary.innerHTML = "";

    const pills = [
      ["removed", `${diff.removed} removed`],
      ["added", `${diff.added} added`],
      ["", diff.removed || diff.added ? "Review before copying" : "No visible text changes"]
    ];

    pills.forEach(([className, text]) => {
      const pill = document.createElement("span");
      pill.className = `diff-pill ${className}`.trim();
      pill.textContent = text;
      summary.appendChild(pill);
    });

    if (status) {
      status.textContent = diff.removed || diff.added || issues.length ? "Changed" : "Clean";
    }

    if (issueList) {
      issueList.innerHTML = "";

      if (issues.length) {
        issues.slice(0, 6).forEach((issue) => {
          const item = document.createElement("div");
          item.className = "issue-item";
          item.innerHTML = `<span class="issue-check">✓</span><span>${issue}</span>`;
          issueList.appendChild(item);
        });
      } else {
        const item = document.createElement("div");
        item.className = "issue-item diff-empty";
        item.textContent = "No obvious cleanup issues found. PasteLint avoids changing text just to look busy.";
        issueList.appendChild(item);
      }
    }

    outputBox.innerHTML = "";

    if (!diff.removed && !diff.added) {
      const empty = document.createElement("p");
      empty.className = "diff-empty";
      empty.textContent = revised || "No changes to show yet.";
      outputBox.appendChild(empty);
      return;
    }

    diff.pieces.forEach((piece) => {
      const span = document.createElement("span");
      span.textContent = piece.text;

      if (piece.type === "removed") span.className = "diff-token-removed";
      if (piece.type === "added") span.className = "diff-token-added";

      outputBox.appendChild(span);
    });
  }

  function applyReplacements(text, changes) {
    let result = text;

    replacements.forEach(([pattern, replacement, note]) => {
      const before = result;
      result = result.replace(pattern, replacement);
      if (result !== before) changes.push(note);
    });

    return result;
  }

  function applyTone(text, tone, changes) {
    let result = text;
    const before = result;

    if (tone === "natural") {
      result = result
        .replace(/\bI wanted to reach out to (?:you )?because\b/gi, "I'm reaching out because")
        .replace(/\bI am writing to let you know that\b/gi, "I wanted to let you know")
        .replace(/\bThis allows you to\b/gi, "You can")
        .replace(/\bThis helps to\b/gi, "This helps");

      if (result !== before) changes.push("Smoothed phrasing without changing the structure.");
    }

    if (tone === "concise") {
      result = result
        .replace(/\bI wanted to reach out to (?:you )?because\b/gi, "")
        .replace(/\bI am writing to let you know that\b/gi, "")
        .replace(/\bAt this point in time\b/gi, "Now")
        .replace(/\bPlease feel free to\b/gi, "Please")
        .replace(/\b(kind of|sort of|a little bit|somewhat)\b\s*/gi, "")
        .replace(/,\s*(which|that|who)\s+/gi, ". ");

      if (result !== before) {
        changes.push("Removed filler and shortened sentence structure.");
        changes.push("Compressed ideas to make the text faster to read.");
      }
    }

    if (tone === "direct") {
      result = result
        .replace(/\bI was wondering if you could\b/gi, "Could you")
        .replace(/\bWould it be possible to\b/gi, "Please")
        .replace(/\bI just wanted to ask if\b/gi, "Can")
        .replace(/\bI think we may want to consider\b/gi, "We should consider")
        .replace(/\bWould genuinely appreciate feedback\b/gi, "Feedback is welcome")
        .replace(/\b(might|may|possibly|perhaps)\b\s*/gi, "")
        .replace(/,\s*(so|and)\s+/gi, ". ");

      if (result !== before) {
        changes.push("Made the message more direct and actionable.");
        changes.push("Removed hesitation and softened language.");
      }
    }

    if (tone === "professional") {
      result = result
        .replace(/\bhey\b/gi, "Hi")
        .replace(/\bkinda\b/gi, "somewhat")
        .replace(/\bwanna\b/gi, "want to");

      if (result !== before) changes.push("Adjusted wording to be more professional.");
    }

    if (tone === "friendly") {
      result = result
        .replace(/\bPlease respond at your earliest convenience\b/gi, "Whenever you get a chance, please send me your thoughts")
        .replace(/\bI appreciate your consideration\b/gi, "Thanks for taking a look");

      if (result !== before) changes.push("Made the tone more relaxed and conversational.");
    }

    return result;
  }

  function rewriteText(text, tone = "natural", strength = 2) {
    const changes = [];
    let result = cleanText(text, changes);
    const cleanedOriginal = result;

    if (!result) return { text: "", changes: [] };

    result = applyReplacements(result, changes);

    const beforeIntensity = result;
    if (strength >= 2) {
      result = result.replace(/\b(very|really|actually|basically|simply|quite|rather|somewhat|extremely|significantly)\b\s*/gi, "");
    }
    if (result !== beforeIntensity) changes.push("Reduced filler and weak intensifiers.");

    const beforeHumanize = result;
    if ($("humanizeMode")?.checked) {
      result = result
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bcannot\b/gi, "can't")
        .replace(/\bwill not\b/gi, "won't")
        .replace(/\bit is\b/gi, "it's")
        .replace(/\bthat is\b/gi, "that's")
        .replace(/\bwe are\b/gi, "we're")
        .replace(/\byou are\b/gi, "you're");
    }
    if (result !== beforeHumanize) changes.push("Added more natural rhythm and contractions.");

    if (strength >= 3) {
      const beforeSplit = result;
      result = result.replace(/,\s+(which|and this|and it)\s+/gi, ". This ");
      if (result !== beforeSplit) changes.push("Split a long sentence for easier reading.");
    }

    result = applyTone(result, tone, changes);

    const beforePolish = result;
    result = cleanText(result)
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/([.!?]){2,}/g, "$1")
      .trim();

    if (result !== beforePolish) changes.push("Cleaned punctuation, spacing, and formatting.");

    if (result === cleanedOriginal) {
      changes.push("No major cleanup needed — this text is already clear, natural, and readable.");
      changes.push("SecondDraft avoids changing text just to look busy, because unnecessary rewrites can distort meaning.");
    } else {
      const beforeWords = wordCount(cleanedOriginal);
      const afterWords = wordCount(result);

      if (afterWords < beforeWords) {
        changes.push(`Shortened the draft by ${beforeWords - afterWords} word${beforeWords - afterWords === 1 ? "" : "s"}.`);
      }

      if (sentenceCount(result) !== sentenceCount(cleanedOriginal)) {
        changes.push("Adjusted sentence flow for easier reading.");
      }
    }

    return { text: result, changes: unique(changes) };
  }

  function ensureTransparencyPanels() {
    const paragraphView = $("paragraphView");

    if (paragraphView && !$("paragraphTransparency")) {
      const panel = document.createElement("section");
      panel.id = "paragraphTransparency";
      panel.className = "paragraph-transparency";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="transparency-header">
          <h3>What changed</h3>
          <p>Compare the original, the SecondDraft result, and the main changes before copying.</p>
        </div>
        <div class="transparency-grid">
          <div><strong>Original</strong><p id="paragraphOriginal"></p></div>
          <div><strong>SecondDraft</strong><p id="paragraphRewritten"></p></div>
          <div><strong>Changes</strong><ul id="paragraphChanges"></ul></div>
        </div>
      `;
      paragraphView.insertAdjacentElement("afterend", panel);
    }
  }

  function showOutputTools(hasOutput) {
    if ($("outputTools")) $("outputTools").hidden = !hasOutput;

    const quickActions = document.querySelector(".quick-actions");
    if (quickActions) quickActions.hidden = !hasOutput;

    if ($("reviewNote")) $("reviewNote").hidden = !hasOutput;

    const isLineMode = $("lineView") && $("lineView").hidden === false;
    if ($("paragraphTransparency")) $("paragraphTransparency").hidden = !hasOutput || isLineMode;
  }

  function renderChanges(changes) {
    const cleanChanges = unique(changes);
    const list = $("changeList");

    if (list) {
      list.innerHTML = "";
      cleanChanges.forEach((change) => {
        const li = document.createElement("li");
        li.textContent = change;
        list.appendChild(li);
      });
    }

    if ($("paragraphTransparency")) {
      $("paragraphOriginal").textContent = input?.value || "";
      $("paragraphRewritten").textContent = output?.value || "";
      $("paragraphChanges").innerHTML = "";

      cleanChanges.forEach((change) => {
        const li = document.createElement("li");
        li.textContent = change;
        $("paragraphChanges").appendChild(li);
      });
    }

    if ($("insightToggle")) {
      $("insightToggle").hidden = !cleanChanges.length || !output?.value.trim();
    }

    showOutputTools(Boolean(output?.value.trim()));
  }

  function currentTone() {
    return $("toneMode")?.value || "natural";
  }

  function currentStrength() {
    return Number($("rewriteStrength")?.value || 2);
  }

  function renderLineView() {
    const lineView = $("lineView");
    const lineResults = $("lineResults");

    if (!lineView || lineView.hidden || !lineResults || !input) return;

    const lines = input.value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    lineResults.innerHTML = "";

    if (!lines.length) {
      lineResults.innerHTML = '<p class="empty-state">Paste text to see line-by-line rewrites.</p>';
      return;
    }

    lines.forEach((line) => {
      const result = rewriteText(line, currentTone(), currentStrength());
      const pair = document.createElement("div");
      pair.className = "line-pair line-pair-three";
      pair.innerHTML = `
        <div><small>Original</small><p></p></div>
        <div><small>SecondDraft</small><p></p></div>
        <div><small>Changes</small><ul></ul></div>
      `;

      pair.querySelectorAll("p")[0].textContent = line;
      pair.querySelectorAll("p")[1].textContent = result.text;

      const notes = pair.querySelector("ul");
      result.changes.forEach((change) => {
        const li = document.createElement("li");
        li.textContent = change;
        notes.appendChild(li);
      });

      lineResults.appendChild(pair);
    });
  }

  async function copyText(text) {
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const temp = document.createElement("textarea");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      const copied = document.execCommand("copy");
      temp.remove();
      return copied;
    }
  }

  function setDisclosure(buttonId, panelId) {
    const button = $(buttonId);
    const panel = $(panelId);

    button?.addEventListener("click", () => {
      if (!panel) return;

      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
    });
  }

  function updateStrengthLabel() {
    const value = currentStrength();
    const label = $("strengthLabel");

    if (label) {
      label.textContent = value === 1 ? "Light" : value === 3 ? "Strong" : "Balanced";
    }
  }

  ensureTransparencyPanels();

  if (input && output && cleanBtn && !rewriteBtn) {
    input.addEventListener("input", updateCounts);

    cleanBtn.addEventListener("click", () => {
      const original = input.value;
      const cleaned = cleanText(original);

      output.value = cleaned;
      updateCounts();
      renderHomepageDiff(original, cleaned);
    });
  }

  if (input && output && rewriteBtn) {
    input.addEventListener("input", () => {
      updateCounts();
      renderLineView();
    });

    $("rewriteStrength")?.addEventListener("input", () => {
      updateStrengthLabel();
      renderLineView();
    });

    $("toneMode")?.addEventListener("change", renderLineView);
    $("humanizeMode")?.addEventListener("change", renderLineView);

    rewriteBtn.addEventListener("click", () => {
      const result = rewriteText(input.value, currentTone(), currentStrength());

      output.value = result.text;
      updateCounts();
      renderChanges(result.changes);
      renderLineView();
    });

    cleanBtn?.addEventListener("click", () => {
      const changes = [];

      output.value = cleanText(input.value, changes);
      updateCounts();
      renderChanges(changes.length ? changes : ["No major cleanup needed — the text already looks clean."]);
      renderLineView();
    });

    $("versionsBtn")?.addEventListener("click", () => {
      const base = input.value.trim();
      const versionsPanel = $("versionsPanel");

      if (!base || !versionsPanel) return;

      const versions = [
        ["Natural", "Light smoothing with minimal change.", rewriteText(base, "natural", 2)],
        ["Concise", "Shorter and tighter.", rewriteText(base, "concise", 3)],
        ["Direct", "Clearer ask and sharper wording.", rewriteText(base, "direct", 3)]
      ];

      versionsPanel.hidden = false;
      versionsPanel.innerHTML = '<h3>Choose a version</h3><div class="version-grid"></div>';

      const grid = versionsPanel.querySelector(".version-grid");

      versions.forEach(([label, description, result]) => {
        const card = document.createElement("article");
        card.className = "version-card";
        card.innerHTML = `
          <strong></strong>
          <small></small>
          <p></p>
          <ul></ul>
          <button class="small-copy" type="button">Use this version</button>
        `;

        card.querySelector("strong").textContent = label;
        card.querySelector("small").textContent = description;
        card.querySelector("p").textContent = result.text;

        const ul = card.querySelector("ul");
        result.changes.forEach((change) => {
          const li = document.createElement("li");
          li.textContent = change;
          ul.appendChild(li);
        });

        card.querySelector("button").addEventListener("click", async () => {
          output.value = result.text;
          updateCounts();
          renderChanges(result.changes);
          await copyText(result.text);
        });

        grid.appendChild(card);
      });
    });

    document.querySelectorAll(".quick-actions button").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        const tone = action === "shorter" ? "concise" : action === "simpler" ? "friendly" : "natural";
        const result = rewriteText(output.value || input.value, tone, action === "clearer" ? 2 : 3);

        output.value = result.text;
        updateCounts();
        renderChanges(result.changes);
      });
    });

    $("paragraphMode")?.addEventListener("click", () => {
      $("paragraphView").hidden = false;
      $("lineView").hidden = true;
      $("paragraphMode").classList.add("active");
      $("lineMode")?.classList.remove("active");
      showOutputTools(Boolean(output?.value.trim()));
    });

    $("lineMode")?.addEventListener("click", () => {
      $("paragraphView").hidden = true;
      $("lineView").hidden = false;
      $("lineMode").classList.add("active");
      $("paragraphMode")?.classList.remove("active");

      if ($("paragraphTransparency")) $("paragraphTransparency").hidden = true;

      renderLineView();
    });

    setDisclosure("advancedToggle", "advancedOptions");
    setDisclosure("moreOptionsToggle", "moreOptions");
    setDisclosure("insightToggle", "insightPanel");
    updateStrengthLabel();
  }

  copyBtn?.addEventListener("click", async () => {
    const copied = await copyText(output?.value || "");

    if (!copied) return;

    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1200);
  });

  clearBtn?.addEventListener("click", () => {
    if (input) input.value = "";
    if (output) output.value = "";

    if ($("versionsPanel")) $("versionsPanel").hidden = true;
    if ($("paragraphTransparency")) $("paragraphTransparency").hidden = true;
    if ($("insightPanel")) $("insightPanel").hidden = true;
    if ($("diffPanel")) $("diffPanel").hidden = true;

    if ($("lineResults")) {
      $("lineResults").innerHTML = '<p class="empty-state">Paste text to see line-by-line rewrites.</p>';
    }

    updateCounts();
    showOutputTools(false);
  });

  updateCounts();
  showOutputTools(Boolean(output?.value.trim()));
});document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const savedTheme = localStorage.getItem("pastelint-theme");
  if (savedTheme) document.body.dataset.theme = savedTheme;

  document.querySelectorAll(".theme-toggle button").forEach((button) => {
    button.setAttribute("type", "button");
    button.addEventListener("click", () => {
      document.body.dataset.theme = button.dataset.theme;
      localStorage.setItem("pastelint-theme", button.dataset.theme);
    });
  });

  const input = $("input");
  const output = $("output");
  const cleanBtn = $("cleanBtn");
  const rewriteBtn = $("rewriteBtn");
  const copyBtn = $("copyBtn");
  const clearBtn = $("clearBtn");

  function wordCount(text) {
    return (text.trim().match(/\b[\w'-]+\b/g) || []).length;
  }

  function updateCounts() {
    if ($("charCount") && input) $("charCount").textContent = `${input.value.length} chars`;
    if ($("wordCount") && input) $("wordCount").textContent = `${wordCount(input.value)} words`;
    if ($("outputCharCount") && output) $("outputCharCount").textContent = `${output.value.length} chars`;
    if ($("outputWordCount") && output) $("outputWordCount").textContent = `${wordCount(output.value)} words`;
  }

  function cleanText(text) {
    return (text || "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, " - ")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/[ \t]+$/gm, "")
      .trim()
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/([^.!?:;])\n(?=[a-z0-9])/gi, "$1 "))
      .join("\n\n");
  }

  function detectCleanupIssues(text) {
    const issues = [];
    const count = (regex) => (text.match(regex) || []).length;

    const hidden = count(/[\u200B-\u200D\uFEFF]/g);
    const smartQuotes = count(/[“”‘’]/g);
    const longDashes = count(/[–—]/g);
    const extraSpaces = count(/[ \t]{2,}/g);
    const tooManyBreaks = count(/\n{3,}/g);
    const trailingSpaces = count(/[ \t]+$/gm);

    if (hidden) issues.push(`${hidden} hidden Unicode character${hidden === 1 ? "" : "s"} removed`);
    if (smartQuotes) issues.push(`${smartQuotes} smart quote${smartQuotes === 1 ? "" : "s"} normalized`);
    if (longDashes) issues.push(`${longDashes} long dash${longDashes === 1 ? "" : "es"} converted to hyphens`);
    if (extraSpaces) issues.push(`${extraSpaces} extra spacing issue${extraSpaces === 1 ? "" : "s"} cleaned`);
    if (tooManyBreaks) issues.push(`${tooManyBreaks} large paragraph gap${tooManyBreaks === 1 ? "" : "s"} tightened`);
    if (trailingSpaces) issues.push(`${trailingSpaces} trailing space issue${trailingSpaces === 1 ? "" : "s"} removed`);
    if (/[&@#$%]/.test(text)) issues.push("IVR/TTS-sensitive symbols detected for review");

    return issues;
  }

  function diffTokens(original, revised) {
    const tokenize = (value) => (value || "").match(/\s+|[^\s]+/g) || [];
    const a = tokenize(original);
    const b = tokenize(revised);

    const rows = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );

    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        rows[i][j] =
          a[i] === b[j]
            ? rows[i + 1][j + 1] + 1
            : Math.max(rows[i + 1][j], rows[i][j + 1]);
      }
    }

    const pieces = [];
    let i = 0;
    let j = 0;
    let removed = 0;
    let added = 0;

    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        pieces.push({ type: "same", text: a[i] });
        i++;
        j++;
      } else if (rows[i + 1][j] >= rows[i][j + 1]) {
        pieces.push({ type: "removed", text: a[i] });
        removed++;
        i++;
      } else {
        pieces.push({ type: "added", text: b[j] });
        added++;
        j++;
      }
    }

    while (i < a.length) {
      pieces.push({ type: "removed", text: a[i] });
      removed++;
      i++;
    }

    while (j < b.length) {
      pieces.push({ type: "added", text: b[j] });
      added++;
      j++;
    }

    return { pieces, removed, added };
  }

  function renderBasicDiff(original, revised) {
    const panel = $("diffPanel");
    const summary = $("diffSummary");
    const outputBox = $("diffOutput");
    const issueList = $("issueList");

    if (!panel || !summary || !outputBox) return;

    const hasText = Boolean((original || "").trim() || (revised || "").trim());
    panel.hidden = !hasText;
    if (!hasText) return;

    const diff = diffTokens(original, revised);
    const issues = detectCleanupIssues(original);

    summary.innerHTML = "";
    const removedPill = document.createElement("span");
    removedPill.className = "diff-pill removed";
    removedPill.textContent = `${diff.removed} removed`;

    const addedPill = document.createElement("span");
    addedPill.className = "diff-pill added";
    addedPill.textContent = `${diff.added} added`;

    const reviewPill = document.createElement("span");
    reviewPill.className = "diff-pill";
    reviewPill.textContent =
      diff.removed || diff.added ? "Review changes" : "No visible text changes";

    summary.append(removedPill, addedPill, reviewPill);

    if (issueList) {
      issueList.innerHTML = "";

      if (issues.length) {
        issues.slice(0, 6).forEach((issue) => {
          const item = document.createElement("div");
          item.className = "issue-item";
          item.innerHTML = `<span class="issue-check">✓</span><span>${issue}</span>`;
          issueList.appendChild(item);
        });
      } else {
        const item = document.createElement("div");
        item.className = "issue-item diff-empty";
        item.textContent =
          "No obvious cleanup issues found. PasteLint avoids changing text just to look busy.";
        issueList.appendChild(item);
      }
    }

    outputBox.innerHTML = "";

    if (!diff.removed && !diff.added) {
      const empty = document.createElement("p");
      empty.className = "diff-empty";
      empty.textContent = revised || "No changes to show yet.";
      outputBox.appendChild(empty);
      return;
    }

    diff.pieces.forEach((piece) => {
      const span = document.createElement("span");
      span.textContent = piece.text;

      if (piece.type === "removed") span.className = "diff-token-removed";
      if (piece.type === "added") span.className = "diff-token-added";

      outputBox.appendChild(span);
    });
  }

  async function copyText(text) {
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const temp = document.createElement("textarea");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      const copied = document.execCommand("copy");
      temp.remove();
      return copied;
    }
  }

  if (input && output && cleanBtn && !rewriteBtn) {
    input.addEventListener("input", () => {
      updateCounts();
    });

    cleanBtn.addEventListener("click", () => {
      const original = input.value;
      const cleaned = cleanText(original);

      output.value = cleaned;
      updateCounts();
      renderBasicDiff(original, cleaned);
    });
  }

  copyBtn?.addEventListener("click", async () => {
    const copied = await copyText(output?.value || "");
    if (!copied) return;

    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1200);
  });

  clearBtn?.addEventListener("click", () => {
    if (input) input.value = "";
    if (output) output.value = "";
    if ($("diffPanel")) $("diffPanel").hidden = true;
    updateCounts();
  });

  updateCounts();
});document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const cleanBtn = document.getElementById("cleanBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");

  const diffPanel = document.getElementById("diffPanel");
  const diffOutput = document.getElementById("diffOutput");
  const diffSummary = document.getElementById("diffSummary");

  function cleanText(text) {
    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function detectIssues(text) {
    const issues = [];

    if (/[“”‘’]/.test(text)) issues.push("smart quotes");
    if (/[–—]/.test(text)) issues.push("long dashes");
    if (/[\u200B-\u200D\uFEFF]/.test(text)) issues.push("hidden characters");
    if (/[&@#$%]/.test(text)) issues.push("IVR/TTS-sensitive symbols");
    if (/[ \t]{2,}/.test(text)) issues.push("extra spaces");

    return issues;
  }

  function generateDiff(original, cleaned) {
    const originalWords = original.split(/\s+/);
    const cleanedWords = cleaned.split(/\s+/);

    let result = "";
    let removed = 0;
    let added = 0;

    const max = Math.max(originalWords.length, cleanedWords.length);

    for (let i = 0; i < max; i++) {
      const o = originalWords[i];
      const c = cleanedWords[i];

      if (o === c) {
        result += o ? o + " " : "";
      } else {
        if (o) {
          result += `<span class="diff-removed">${o}</span> `;
          removed++;
        }
        if (c) {
          result += `<span class="diff-added">${c}</span> `;
          added++;
        }
      }
    }

    return { html: result, removed, added };
  }

  cleanBtn.addEventListener("click", () => {
    const original = input.value;
    const cleaned = cleanText(original);

    output.value = cleaned;

    const issues = detectIssues(original);
    const diff = generateDiff(original, cleaned);

    diffOutput.innerHTML = diff.html;

    diffSummary.innerHTML = `
      ${issues.length ? "Detected: " + issues.join(", ") + "<br>" : ""}
      ${diff.removed} tokens removed, ${diff.added} tokens added
    `;

    diffPanel.hidden = false;
  });

  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = "Copied";
    setTimeout(() => copyBtn.textContent = "Copy", 1000);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    diffPanel.hidden = true;
  });

});
