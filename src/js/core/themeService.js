// src/js/core/themeService.js
import * as DOM from '../ui/domElements.js';

const THEME_STORAGE_KEY = 'theme';
let currentTranslationObject = {}; // To store the current language's translation object

function updateToggleButtonAria(isDark) {
    if (!DOM.themeToggleBtn) return;
    // Use the stored currentTranslationObject
    const t = currentTranslationObject || {};
    const key = isDark ? 'themeToggleLight' : 'themeToggleDark';
    // Provide English fallbacks directly here if keys are missing
    const fallbackText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    DOM.themeToggleBtn.setAttribute('aria-label', t[key] || fallbackText);
}

export function applyTheme(theme) { // theme is 'dark' or 'light'
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateToggleButtonAria(theme === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme(getTranslationsFunc) {
    // This function now relies on i18nService to provide translations when they are ready.
    // The initial ARIA label will be set/updated when i18nService calls updateThemeServiceTranslations.
    if (DOM.themeToggleBtn) {
        DOM.themeToggleBtn.addEventListener('click', () => {
            const currentThemeIsDark = document.body.classList.contains('dark-theme');
            const newTheme = currentThemeIsDark ? 'light' : 'dark';
            applyTheme(newTheme); // applyTheme will call updateToggleButtonAria
        });
    }
}

export function applyThemeOnLoad() {
    // This function should be called very early, before translations are loaded.
    // It just sets the class on the body. ARIA label will be updated later.
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) ||
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    // Initial ARIA label update with fallbacks, will be refined by i18nService
    updateToggleButtonAria(savedTheme === 'dark');
}


// This function will be called by i18nService after translations are loaded/changed
export function updateThemeServiceTranslations(newTranslations) {
    currentTranslationObject = newTranslations || {};
    // Re-apply ARIA label with new translations
    updateToggleButtonAria(document.body.classList.contains('dark-theme'));
}
