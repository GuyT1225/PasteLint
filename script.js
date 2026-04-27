// PasteLint v2 — final script with tone + line mode

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

/* Clean */
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

/* Tone */
function applyTone(t, tone){
  if(tone==="concise"){
    t=t.replace(/\b(that|actually|basically|kind of|sort of)\b/gi,"");
  }
  if(tone==="professional"){
    t=t.replace(/\bgonna\b/gi,"going to");
  }
  if(tone==="friendly"){
    t=t.replace(/\bshould\b/gi,"can");
  }
  if(tone==="direct"){
    t=t.replace(/\bmay be able to\b/gi,"can");
  }
  return t.trim();
}

/* Rewrite */
function secondDraft(text, tone="natural"){
  let cleaned = cleanText(text);
  if(!cleaned) return "";

  let sentences = cleaned.split(/(?<=[.!?])\s+/);

  return sentences.map(s=>{
    let t=s.trim();

    // remove filler
    t=t.replace(/^(It is important to note that|In conclusion|With that being said),?\s*/i,"");

    // simplify structure
    t=t.replace(/plays a .* role in/gi,"helps");

    // vocabulary cleanup
    t=t.replace(/\b(utilize|leverage)\b/gi,"use");

    // remove fluff
    t=t.replace(/\b(very|really|extremely)\b/gi,"");

    // tone pass
    t=applyTone(t,tone);

    return t.replace(/\s{2,}/g," ");
  }).join(" ").trim();
}

/* Init SecondDraft */
(function(){
  const input=document.getElementById("input");
  const output=document.getElementById("output");
  const rewriteBtn=document.getElementById("rewriteBtn");
  const versionsBtn=document.getElementById("versionsBtn");
  const versionsPanel=document.getElementById("versionsPanel");
  const copyBtn=document.getElementById("copyBtn");
  const clearBtn=document.getElementById("clearBtn");
  const tone=document.getElementById("toneMode");

  if(!rewriteBtn || !input || !output) return;

  function runRewrite(){
    output.value=secondDraft(input.value, tone?.value || "natural");
    if (versionsPanel) versionsPanel.hidden = true;
  }

  function makeVersion(text, label, toneName){
    return `// PasteLint v2 — full script (clean + SecondDraft + tone + versions)

const body = document.body;

/* =========================
   THEME
========================= */
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

/* =========================
   CLEAN TEXT
========================= */
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

/* =========================
   TONE
========================= */
function applyTone(t, tone){
  if(tone==="concise"){
    t=t.replace(/\b(that|actually|basically|kind of|sort of)\b/gi,"");
  }

  if(tone==="professional"){
    t=t.replace(/\bgonna\b/gi,"going to");
  }

  if(tone==="friendly"){
    t=t.replace(/\bshould\b/gi,"can");
  }

  if(tone==="direct"){
    t=t.replace(/\bmay be able to\b/gi,"can");
  }

  return t.trim();
}

/* =========================
   SECOND DRAFT ENGINE
========================= */
function secondDraft(text, tone="natural"){
  let cleaned = cleanText(text);
  if(!cleaned) return "";

  let sentences = cleaned.split(/(?<=[.!?])\s+/);

  return sentences.map(s=>{
    let t=s.trim();

    // Remove filler openings
    t=t.replace(/^(It is important to note that|In conclusion|With that being said),?\s*/i,"");

    // Simplify structure
    t=t.replace(/plays a .* role in/gi,"helps");

    // Vocabulary cleanup
    t=t.replace(/\b(utilize|leverage)\b/gi,"use");

    // Remove fluff
    t=t.replace(/\b(very|really|extremely)\b/gi,"");

    // Tone pass
    t=applyTone(t,tone);

    return t.replace(/\s{2,}/g," ");
  }).join(" ").trim();
}

/* =========================
   INIT SECOND DRAFT UI
========================= */
(function(){
  const input=document.getElementById("input");
  const output=document.getElementById("output");
  const rewriteBtn=document.getElementById("rewriteBtn");
  const versionsBtn=document.getElementById("versionsBtn");
  const versionsPanel=document.getElementById("versionsPanel");
  const copyBtn=document.getElementById("copyBtn");
  const clearBtn=document.getElementById("clearBtn");
  const tone=document.getElementById("toneMode");

  if(!rewriteBtn || !input || !output) return;

  function runRewrite(){
    output.value=secondDraft(input.value, tone?.value || "natural");
    if (versionsPanel) versionsPanel.hidden = true;
  }

  function makeVersion(text, label, toneName){
    return `
      <div class="version-card">
        <h3>${label}</h3>
        <p>${secondDraft(text, toneName)}</p>
        <button class="btn btn-secondary" type="button" data-copy-version="${toneName}">
          Copy this version
        </button>
      </div>
    `;
  }

  function showVersions(){
    if(!input.value.trim() || !versionsPanel) return;

    versionsPanel.innerHTML =
      makeVersion(input.value, "Version 1 — Natural", "natural") +
      makeVersion(input.value, "Version 2 — Concise", "concise") +
      makeVersion(input.value, "Version 3 — Direct", "direct");

    versionsPanel.hidden = false;

    versionsPanel.querySelectorAll("[data-copy-version]").forEach(btn => {
      btn.addEventListener("click", () => {
        const selectedTone = btn.getAttribute("data-copy-version");
        const text = secondDraft(input.value, selectedTone);
        navigator.clipboard.writeText(text);
        output.value = text;
      });
    });
  }

  rewriteBtn.addEventListener("click", runRewrite);

  versionsBtn?.addEventListener("click", showVersions);

  copyBtn?.addEventListener("click", ()=>{
    navigator.clipboard.writeText(output.value);
  });

  clearBtn?.addEventListener("click", ()=>{
    input.value="";
    output.value="";
    if (versionsPanel) {
      versionsPanel.innerHTML="";
      versionsPanel.hidden=true;
    }
  });

})();
      <div class="version-card">
        <h3>${label}</h3>
        <p>${secondDraft(text, toneName)}</p>
        <button class="btn btn-secondary" type="button" data-copy-version="${toneName}">
          Copy this version
        </button>
      </div>
    `;
  }

  function showVersions(){
    if(!input.value.trim() || !versionsPanel) return;

    versionsPanel.innerHTML =
      makeVersion(input.value, "Version 1 — Natural", "natural") +
      makeVersion(input.value, "Version 2 — Concise", "concise") +
      makeVersion(input.value, "Version 3 — Direct", "direct");

    versionsPanel.hidden = false;

    versionsPanel.querySelectorAll("[data-copy-version]").forEach(btn => {
      btn.addEventListener("click", () => {
        const selectedTone = btn.getAttribute("data-copy-version");
        const text = secondDraft(input.value, selectedTone);
        navigator.clipboard.writeText(text);
        output.value = text;
      });
    });
  }

  rewriteBtn.addEventListener("click", runRewrite);

  versionsBtn?.addEventListener("click", showVersions);

  copyBtn?.addEventListener("click", ()=>{
    navigator.clipboard.writeText(output.value);
  });

  clearBtn?.addEventListener("click", ()=>{
    input.value="";
    output.value="";
    if (versionsPanel) {
      versionsPanel.innerHTML="";
      versionsPanel.hidden=true;
    }
  });

})();

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
