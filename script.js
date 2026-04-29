document.addEventListener("DOMContentLoaded", () => {

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
