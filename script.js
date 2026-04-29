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
