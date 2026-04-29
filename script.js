document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const input = $("input");
  const output = $("output");
  const cleanBtn = $("cleanBtn");
  const copyBtn = $("copyBtn");
  const clearBtn = $("clearBtn");

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
      .replace(/[–—]/g, "-")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();
  }

  function buildChangeCards(original, cleaned) {
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
      const matches = [...original.matchAll(rule.regex)];
      matches.slice(0, 8).forEach((match) => {
        const index = match.index || 0;
        const beforeStart = Math.max(0, index - 55);
        const beforeEnd = Math.min(original.length, index + match[0].length + 55);

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

    const cards = buildChangeCards(original, cleaned);

    panel.hidden = false;
    summary.innerHTML = "";

    const removedCount = Math.max(0, wordCount(original) - wordCount(cleaned));
    const addedCount = Math.max(0, wordCount(cleaned) - wordCount(original));

    const summaryItems = [
      `${cards.length} cleanup point${cards.length === 1 ? "" : "s"} found`,
      `${removedCount} word${removedCount === 1 ? "" : "s"} removed`,
      `${addedCount} word${addedCount === 1 ? "" : "s"} added`
    ];

    summaryItems.forEach((text) => {
      const pill = document.createElement("span");
      pill.className = "diff-pill";
      pill.textContent = text;
      summary.appendChild(pill);
    });

    if (status) status.textContent = cards.length ? "Changed" : "Clean";

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
        item.textContent = "No obvious cleanup issues found.";
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

      block.querySelectorAll("p")[0].textContent = card.original;
      block.querySelectorAll("p")[1].textContent = card.cleaned;
      block.querySelectorAll("p")[2].textContent = card.why;

      outputBox.appendChild(block);
    });
  }

  function wireAdvancedButtons() {
    document.querySelectorAll("[data-panel-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.panelTarget);
        if (!target) return;

        target.hidden = !target.hidden;
        button.setAttribute("aria-expanded", String(!target.hidden));
      });
    });

    document.querySelectorAll(".advanced-features button, .advanced-tabs button").forEach((button) => {
      button.type = "button";
      button.addEventListener("click", () => {
        const label = button.textContent.trim().toLowerCase();

        if (label.includes("show changes") && $("diffPanel")) {
          $("diffPanel").hidden = !$("diffPanel").hidden;
        }

        if (label.includes("custom rules") && $("customRulesPanel")) {
          $("customRulesPanel").hidden = !$("customRulesPanel").hidden;
        }

        if (label.includes("session history") && $("sessionHistoryPanel")) {
          $("sessionHistoryPanel").hidden = !$("sessionHistoryPanel").hidden;
        }
      });
    });
  }

  cleanBtn?.addEventListener("click", () => {
    const original = input.value;
    const cleaned = cleanText(original);

    output.value = cleaned;
    updateCounts();
    renderTransparency(original, cleaned);
  });

  copyBtn?.addEventListener("click", async () => {
    if (!output?.value) return;
    await navigator.clipboard.writeText(output.value);
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

  input?.addEventListener("input", updateCounts);

  wireAdvancedButtons();
  updateCounts();
});
