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

/* SecondDraft rewrite */
function secondDraft(text) {
  let t = cleanText(text);

  const rules = [
    [/in conclusion,?/gi, ""],
    [/it is important to note that/gi, ""],
    [/with that being said,?/gi, ""],
    [/in today's world,?/gi, ""],
    [/leverage/gi, "use"],
    [/utilize/gi, "use"],
    [/facilitate/gi, "help"],
    [/robust/gi, "solid"],
    [/seamless/gi, "smooth"],
    [/transformative/gi, "useful"],
    [/in order to/gi, "to"],
    [/due to the fact that/gi, "because"]
  ];

  rules.forEach(([pattern, replace]) => {
    t = t.replace(pattern, replace);
  });

  return t.replace(/\s{2,}/g, " ").trim();
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
