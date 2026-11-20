// Apply an explicit preference before the first paint. With no saved choice,
// color-scheme follows the system and the stylesheet works without JavaScript.
(() => {
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let preference;
  try { preference = localStorage.getItem("theme"); } catch {}
  if (preference === "light" || preference === "dark") {
    root.style.colorScheme = preference;
  }
  const currentTheme = () => root.style.colorScheme || (system.matches ? "dark" : "light");
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("[data-theme-toggle]");
    const update = () => {
      const theme = currentTheme();
      const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      button.setAttribute("aria-label", label);
      button.title = label;
      button.querySelector("use").setAttribute("href", "/brand/icons.svg#" + (theme === "dark" ? "moon" : "sun"));
    };
    button.addEventListener("click", () => {
      root.style.colorScheme = currentTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", root.style.colorScheme); } catch {}
      update();
    });
    system.addEventListener("change", update);
    update();
    button.hidden = false;
  });
})();
