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

  if (!cleaned) return "";

  let sentences = cleaned.split(/(?<=[.!?])\s+/);

  let rewritten = sentences.map(sentence => {
    let t = sentence.trim();

    // Remove chatbot / filler openings
    t = t.replace(/^(Great question!?|Excellent point!?|Certainly!?|Absolutely!?|Happy to help!?),?\s*/i, "");
    t = t.replace(/^(It is important to note that|It is worth noting that|With that being said|In conclusion|To sum up|In summary),?\s*/i, "");

    // Simplify common AI/corporate patterns
    t = t.replace(/plays a (crucial|key|important|pivotal) role in/gi, "helps");
    t = t.replace(/serves as a testament to/gi, "shows");
    t = t.replace(/is designed to help/gi, "helps");
    t = t.replace(/provides users with/gi, "gives users");
    t = t.replace(/enables users to/gi, "lets users");
    t = t.replace(/is able to/gi, "can");
    t = t.replace(/in order to/gi, "to");
    t = t.replace(/due to the fact that/gi, "because");

    // Replace inflated wording
    t = t.replace(/\butilize\b/gi, "use");
    t = t.replace(/\bleverage\b/gi, "use");
    t = t.replace(/\bfacilitate\b/gi, "help");
    t = t.replace(/\bempower\b/gi, "help");
    t = t.replace(/\bdemonstrate\b/gi, "show");
    t = t.replace(/\brobust\b/gi, "solid");
    t = t.replace(/\bseamless\b/gi, "smooth");
    t = t.replace(/\btransformative\b/gi, "useful");
    t = t.replace(/\bgroundbreaking\b/gi, "new");
    t = t.replace(/\bmyriad\b/gi, "many");
    t = t.replace(/\bparamount\b/gi, "important");
    t = t.replace(/\bmultifaceted\b/gi, "complex");
    t = t.replace(/\bdelve into\b/gi, "explain");

    // Remove weak intensifiers
    t = t.replace(/\b(very|really|extremely|significantly|highly)\b/gi, "");

    // Smooth spacing
    t = t.replace(/\s{2,}/g, " ").trim();

    return t;
  });

  let result = rewritten
    .filter(Boolean)
    .join(" ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();

  return result;
}

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
