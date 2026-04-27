// PasteLint v2 — clean, simple script

const body = document.body;

/* Theme */
function setTheme(theme) {
  body.classList.remove("light", "dark", "terminal");
  body.classList.add(theme);
  localStorage.setItem("theme", theme);

  document.querySelectorAll("[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

(function initTheme(){
  const saved = localStorage.getItem("theme") || "light";
  setTheme(saved);

  document.querySelectorAll("[data-theme]").forEach(btn => {
    btn.addEventListener("click", () => setTheme(btn.dataset.theme));
  });
})();

/* Basic clean */
function cleanText(text) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function secondDraft(text) {
  let cleaned = cleanText(text);

  // Split into sentences
  let sentences = cleaned.split(/(?<=[.!?])\s+/);

  let rewritten = sentences.map(s => {
    let t = s;

    // Remove leading filler phrases
    t = t.replace(/^(It is important to note that|It is worth noting that|In conclusion|To summarize|With that being said),?\s*/i, "");

    // Simplify common structures
    t = t.replace(/plays a (crucial|key|important) role in/gi, "helps");
    t = t.replace(/is able to/gi, "can");
    t = t.replace(/in order to/gi, "to");
    t = t.replace(/due to the fact that/gi, "because");

    // Replace over-formal verbs
    t = t.replace(/\b(utilize|leverage)\b/gi, "use");
    t = t.replace(/\b(facilitate)\b/gi, "help");
    t = t.replace(/\b(demonstrate)\b/gi, "show");

    // Remove fluff words
    t = t.replace(/\b(very|really|extremely|significantly)\b/gi, "");

    // Tighten sentence
    t = t.replace(/\s{2,}/g, " ").trim();

    return t;
  });

  // Join and smooth flow
  let result = rewritten.join(" ");

  // Final polish
  result = result
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();

  return result;
}

/* Helpers */
function copyOutput(el){
  if(!el.value) return;
  navigator.clipboard.writeText(el.value);
}

/* Init cleaner page */
(function initCleaner(){
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const cleanBtn = document.getElementById("cleanBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");

  if(!input || !output) return;

  cleanBtn?.addEventListener("click", ()=>{
    output.value = cleanText(input.value);
  });

  input.addEventListener("input", ()=>{
    output.value = cleanText(input.value);
  });

  copyBtn?.addEventListener("click", ()=>copyOutput(output));

  clearBtn?.addEventListener("click", ()=>{
    input.value = "";
    output.value = "";
  });
})();

/* Init SecondDraft page */
(function initRewrite(){
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const rewriteBtn = document.getElementById("rewriteBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");

  if(!rewriteBtn) return;

  rewriteBtn.addEventListener("click", ()=>{
    output.value = secondDraft(input.value);
  });

  input.addEventListener("input", ()=>{
    output.value = secondDraft(input.value);
  });

  copyBtn?.addEventListener("click", ()=>copyOutput(output));

  clearBtn?.addEventListener("click", ()=>{
    input.value = "";
    output.value = "";
  });
})();
