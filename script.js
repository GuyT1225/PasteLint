// Theme switching (safe on all pages)
document.querySelectorAll(".theme-toggle button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.body.dataset.theme = btn.dataset.theme;
    localStorage.setItem("pastelint-theme", btn.dataset.theme);
  });
});

const savedTheme = localStorage.getItem("pastelint-theme");
if (savedTheme) {
  document.body.dataset.theme = savedTheme;
}

// Guarded tool logic (only runs if tool exists)
const input = document.getElementById("input");
const output = document.getElementById("output");
const rewriteBtn = document.getElementById("rewriteBtn");

if (input && output && rewriteBtn) {
  rewriteBtn.addEventListener("click", () => {
    output.value = input.value; // placeholder logic
  });
}
