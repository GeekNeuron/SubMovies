// src/js/core/themeService.js
// import * as DOM from '../ui/domElements.js'; // Not directly needed if using getElementById here
import { LS_THEME } from '../utils/constants.js';

let currentTranslationObjectForTheme = {}; // Stores current language translations for ARIA labels

function updateToggleButtonVisualState(isDark) {
    // The sun/moon icons are in HTML, CSS handles their visibility via body.dark-theme
    // This function primarily updates the ARIA label of the clickable title container.
    const t = currentTranslationObjectForTheme || {};
    const key = isDark ? 'themeToggleLight' : 'themeToggleDark';
    const fallbackText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    const titleContainer = document.getElementById('titleThemeToggleContainer');
    if (titleContainer) {
        titleContainer.setAttribute('aria-label', t[key] || fallbackText);
    }
}

export function applyTheme(theme) { // theme is 'dark' or 'light'
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateToggleButtonVisualState(theme === 'dark'); // Update ARIA label
  localStorage.setItem(LS_THEME, theme);
}

/**
 * Attaches the theme toggle functionality to the title container.
 */
export function attachThemeToggleToTitle() {
    const titleContainer = document.getElementById('titleThemeToggleContainer');
    if (titleContainer) {
        titleContainer.addEventListener('click', () => {
            const currentThemeIsDark = document.body.classList.contains('dark-theme');
            const newTheme = currentThemeIsDark ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    } else {
        console.warn("Theme toggle trigger element ('titleThemeToggleContainer') not found.");
    }
}

/**
 * Applies the theme on initial page load based on localStorage or system preference.
 * This should be called early, before full i18n might be ready for ARIA labels.
 */
export function applyThemeOnLoad() {
    const savedTheme = localStorage.getItem(LS_THEME) || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    // Initial ARIA label update with fallbacks; will be refined by i18nService
    updateToggleButtonVisualState(savedTheme === 'dark');
}

/**
 * Called by i18nService after its translations are loaded/changed
 * to update ARIA labels on the theme toggle trigger.
 * @param {object} newTranslations - The newly loaded translation object for the current language.
 */
export function updateThemeServiceTranslations(newTranslations) {
    currentTranslationObjectForTheme = newTranslations || {};
    updateToggleButtonVisualState(document.body.classList.contains('dark-theme'));
}

/**
 * Initializes the theme service. For now, this mainly ensures that
 * updateThemeServiceTranslations can be called by i18nService.
 * The actual toggle attachment is now separated.
 */
export function initializeTheme() {
    // applyThemeOnLoad already set the initial theme class.
    // ARIA labels will be updated when i18nService calls updateThemeServiceTranslations.
    // The event listener for the toggle is attached by attachThemeToggleToTitle in main.js.
}
