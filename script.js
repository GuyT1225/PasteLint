document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const input = $("input");
  const output = $("output");
  const cleanBtn = $("cleanBtn");
  const copyBtn = $("copyBtn");
  const clearBtn = $("clearBtn");
  const sendSecondDraftBtn = $("sendSecondDraftBtn");

  const savedTheme = localStorage.getItem("pastelint-theme");
  if (savedTheme) document.body.dataset.theme = savedTheme;

  document.querySelectorAll(".theme-toggle button").forEach((button) => {
    button.type = "button";
    button.addEventListener("click", () => {
      document.body.dataset.theme = button.dataset.theme;
      localStorage.setItem("pastelint-theme", button.dataset.theme);
    });
  });

  function wordCount(text) {
    return ((text || "").trim().match(/\b[\w'-]+\b/g) || []).length;
  }

  function getWords(text) {
    return (text || "").toLowerCase().match(/\b[\w'-]+\b/g) || [];
  }

  function sentenceCount(text) {
    return ((text || "").match(/[.!?]+/g) || []).length;
  }

  function paragraphCount(text) {
    return (text || "")
      .split(/\n{2,}/)
      .filter((p) => p.trim().length > 0).length;
  }

  function updateCounts() {
    if ($("charCount") && input) $("charCount").textContent = `${input.value.length} chars`;
    if ($("wordCount") && input) $("wordCount").textContent = `${wordCount(input.value)} words`;
    if ($("outputCharCount") && output) $("outputCharCount").textContent = `${output.value.length} chars`;
    if ($("outputWordCount") && output) $("outputWordCount").textContent = `${wordCount(output.value)} words`;
  }

  function removeDuplicateQuoteEchoes(text) {
    return (text || "").replace(
      /\b([A-Za-z]+)[’'](s|re|ve|ll|d|t|m)\s+\1[’']\2\b/gi,
      "$1'$2"
    );
  }

  function cleanText(text) {
    let cleaned = (text || "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();

    cleaned = removeDuplicateQuoteEchoes(cleaned);

    return cleaned;
  }

  function detectIssues(text) {
    const source = text || "";
    const issues = [];

    const smartQuotes = (source.match(/[“”‘’]/g) || []).length;
    const longDashes = (source.match(/[–—]/g) || []).length;
    const hidden = (source.match(/[\u200B-\u200D\uFEFF]/g) || []).length;
    const spacing = (source.match(/[ \t]{2,}/g) || []).length;
    const paragraphGaps = (source.match(/\n{3,}/g) || []).length;
    const ttsSymbols = (source.match(/[&@#$%^*]/g) || []).length;

    if (smartQuotes) issues.push(`${smartQuotes} smart quote${smartQuotes === 1 ? "" : "s"} will be normalized`);
    if (longDashes) issues.push(`${longDashes} long dash${longDashes === 1 ? "" : "es"} will be converted`);
    if (hidden) issues.push(`${hidden} hidden character${hidden === 1 ? "" : "s"} will be removed`);
    if (spacing) issues.push(`${spacing} extra spacing issue${spacing === 1 ? "" : "s"} detected`);
    if (paragraphGaps) issues.push(`${paragraphGaps} large paragraph gap${paragraphGaps === 1 ? "" : "s"} detected`);
    if (ttsSymbols) issues.push(`${ttsSymbols} IVR/TTS-sensitive symbol${ttsSymbols === 1 ? "" : "s"} detected`);

    return issues;
  }

  function updateFoundPanel(text) {
    const foundPanel = $("foundPanel");
    const foundList = $("foundList");

    if (!foundPanel || !foundList) return;

    const issues = detectIssues(text);
    foundList.innerHTML = "";

    if (!issues.length) {
      foundPanel.hidden = true;
      return;
    }

    issues.forEach((issue) => {
      const item = document.createElement("div");
      item.className = "issue-item";
      item.innerHTML = `<span class="issue-check">✓</span><span>${issue}</span>`;
      foundList.appendChild(item);
    });

    foundPanel.hidden = false;
  }

  function updateBrief(text) {
    const textBrief = $("textBrief");
    if (!textBrief) return;

    const words = wordCount(text);
    const sentences = sentenceCount(text);
    const paragraphs = paragraphCount(text);
    const readSeconds = Math.max(1, Math.ceil((words / 200) * 60));
    const wps = sentences ? Math.round(words / sentences) : 0;
    const uniqueWords = new Set(getWords(text));
    const vocab = words ? Math.round((uniqueWords.size / words) * 100) : 0;

    if ($("briefWords")) $("briefWords").textContent = words;
    if ($("briefSentences")) $("briefSentences").textContent = sentences;
    if ($("briefParagraphs")) $("briefParagraphs").textContent = paragraphs;
    if ($("briefReadTime")) $("briefReadTime").textContent = `${readSeconds}s`;
    if ($("briefWps")) $("briefWps").textContent = wps;
    if ($("briefVocab")) $("briefVocab").textContent = `${vocab}%`;

    textBrief.hidden = words === 0;
  }

  function buildChangeCards(original) {
    const cards = [];

    const rules = [
      {
        label: "Smart quotes normalized",
        regex: /[“”‘’]/g,
        why: "Converted smart quotes to plain quotes for cleaner reuse."
      },
      {
        label: "Long dash cleaned",
        regex: /[–—]/g,
        why: "Converted long dashes to standard hyphens."
      },
      {
        label: "Extra spacing cleaned",
        regex: /[ \t]{2,}/g,
        why: "Collapsed repeated spaces."
      },
      {
        label: "Large paragraph gap tightened",
        regex: /\n{3,}/g,
        why: "Reduced oversized paragraph breaks."
      },
      {
        label: "Hidden character removed",
        regex: /[\u200B-\u200D\uFEFF]/g,
        why: "Removed invisible Unicode characters."
      },
      {
        label: "IVR/TTS-sensitive symbol found",
        regex: /[&@#$%^*]/g,
        why: "Flagged symbols that may need review for voice or plain-text use."
      }
    ];

    rules.forEach((rule) => {
      const matches = [...(original || "").matchAll(rule.regex)];

      matches.slice(0, 8).forEach((match) => {
        const index = match.index || 0;
        const beforeStart = Math.max(0, index - 70);
        const beforeEnd = Math.min(original.length, index + match[0].length + 70);

        const originalSnippet = original.slice(beforeStart, beforeEnd);
        const cleanedSnippet = cleanText(originalSnippet);

        cards.push({
          label: rule.label,
          original: originalSnippet,
          cleaned: cleanedSnippet,
          why: rule.why
        });
      });
    });

    return cards;
  }

  function renderTransparency(original, cleaned) {
    const panel = $("diffPanel");
    const summary = $("diffSummary");
    const outputBox = $("diffOutput");
    const issueList = $("issueList");
    const status = $("diffStatus");

    if (!panel || !summary || !outputBox) return;

    const cards = buildChangeCards(original);
    const issues = detectIssues(original);

    panel.hidden = false;
    summary.innerHTML = "";

    const beforeWords = wordCount(original);
    const afterWords = wordCount(cleaned);
    const removedCount = Math.max(0, beforeWords - afterWords);
    const addedCount = Math.max(0, afterWords - beforeWords);

    [
      `${cards.length} cleanup point${cards.length === 1 ? "" : "s"} mapped`,
      `${removedCount} word${removedCount === 1 ? "" : "s"} removed`,
      `${addedCount} word${addedCount === 1 ? "" : "s"} added`
    ].forEach((text) => {
      const pill = document.createElement("span");
      pill.className = "diff-pill";
      pill.textContent = text;
      summary.appendChild(pill);
    });

    if (status) status.textContent = issues.length || cards.length ? "Changed" : "Clean";

    if (issueList) {
      issueList.innerHTML = "";

      const grouped = [...new Set(cards.map((card) => card.label))];

      if (grouped.length) {
        grouped.forEach((label) => {
          const item = document.createElement("div");
          item.className = "issue-item";
          item.innerHTML = `<span class="issue-check">✓</span><span>${label}</span>`;
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

    if (!cards.length) {
      const empty = document.createElement("p");
      empty.className = "diff-empty";
      empty.textContent = "PasteLint did not find obvious cleanup issues. The text already looks usable.";
      outputBox.appendChild(empty);
      return;
    }

    cards.slice(0, 24).forEach((card) => {
      const block = document.createElement("article");
      block.className = "change-card";

      block.innerHTML = `
        <div class="change-card-title">${card.label}</div>
        <div class="change-grid">
          <div>
            <small>Original context</small>
            <p></p>
          </div>
          <div>
            <small>Cleaned context</small>
            <p></p>
          </div>
          <div>
            <small>Why</small>
            <p></p>
          </div>
        </div>
      `;

      const paragraphs = block.querySelectorAll("p");
      paragraphs[0].textContent = card.original;
      paragraphs[1].textContent = card.cleaned;
      paragraphs[2].textContent = card.why;

      outputBox.appendChild(block);
    });
  }

  cleanBtn?.addEventListener("click", () => {
    const original = input?.value || "";
    const cleaned = cleanText(original);

    if (output) output.value = cleaned;

    updateCounts();
    updateFoundPanel(original);
    updateBrief(cleaned);
    renderTransparency(original, cleaned);
  });

  input?.addEventListener("input", () => {
    updateCounts();
    updateFoundPanel(input.value);
    updateBrief(input.value);

    if (!input.value.trim()) {
      if ($("foundPanel")) $("foundPanel").hidden = true;
      if ($("textBrief")) $("textBrief").hidden = true;
    }
  });

  copyBtn?.addEventListener("click", async () => {
    if (!output?.value) return;

    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.select();
      document.execCommand("copy");
    }

    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1200);
  });

  clearBtn?.addEventListener("click", () => {
    if (input) input.value = "";
    if (output) output.value = "";

    if ($("diffPanel")) $("diffPanel").hidden = true;
    if ($("foundPanel")) $("foundPanel").hidden = true;
    if ($("textBrief")) $("textBrief").hidden = true;

    updateCounts();
  });

  sendSecondDraftBtn?.addEventListener("click", () => {
    const text = output?.value || input?.value || "";
    if (!text.trim()) return;

    sessionStorage.setItem("pastelint-second-draft-input", text);
    window.location.href = "second-draft.html";
  });

  updateCounts();
});
