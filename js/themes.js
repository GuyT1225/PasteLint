document.addEventListener("DOMContentLoaded", () => {
  bindThemeButtons();
});

const PASTELINT_THEME_STORAGE_KEY = "pastelint-theme";
const PASTELINT_ALLOWED_THEMES = ["light", "dark", "terminal"];
const PASTELINT_DEFAULT_THEME = "light";

function bindThemeButtons() {
  const themeButtons = document.querySelectorAll("[data-theme-choice]");
  const savedTheme =
    localStorage.getItem(PASTELINT_THEME_STORAGE_KEY) || PASTELINT_DEFAULT_THEME;

  applyTheme(savedTheme);

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.themeChoice;
      applyTheme(theme);
    });
  });
}

function applyTheme(theme) {
  const safeTheme = PASTELINT_ALLOWED_THEMES.includes(theme)
    ? theme
    : PASTELINT_DEFAULT_THEME;

  document.documentElement.setAttribute("data-theme", safeTheme);
  localStorage.setItem(PASTELINT_THEME_STORAGE_KEY, safeTheme);

  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    const isActive = button.dataset.themeChoice === safeTheme;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}
