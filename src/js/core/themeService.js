// src/js/core/themeService.js
import * as DOM from '../ui/domElements.js'; // Assuming titleThemeToggleContainer is in domElements.js
import { LS_THEME } from '../utils/constants.js';

let currentTranslationObjectForTheme = {};

function updateToggleButtonVisualState(isDark) {
    // This function now just ensures the body class is correct for CSS to handle icon visibility
    // The sun/moon icons are directly in HTML now, managed by CSS based on body.dark-theme
    // However, we still need to update the ARIA label.
    const t = currentTranslationObjectForTheme || {};
    const key = isDark ? 'themeToggleLight' : 'themeToggleDark';
    const fallbackText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'; // English fallback

    // If titleThemeToggleContainer is the button, set ARIA label there.
    // If a separate button was used, target that. We assume titleThemeToggleContainer.
    const toggleContainer = document.getElementById('titleThemeToggleContainer');
    if(toggleContainer) {
        toggleContainer.setAttribute('aria-label', t[key] || fallbackText);
    }
}

export function applyTheme(theme) { 
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateToggleButtonVisualState(theme === 'dark');
  localStorage.setItem(LS_THEME, theme);
}

export function attachThemeToggleToTitle() {
    const titleContainer = document.getElementById('titleThemeToggleContainer');
    if (titleContainer) {
        titleContainer.addEventListener('click', () => {
            const currentThemeIsDark = document.body.classList.contains('dark-theme');
            const newTheme = currentThemeIsDark ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    } else {
        console.warn("Title theme toggle container not found.");
    }
}

export function applyThemeOnLoad() {
    const savedTheme = localStorage.getItem(LS_THEME) || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    // ARIA label will be updated once translations are loaded via updateThemeServiceTranslations
}

export function initializeTheme(getTranslationsFunc) {
    // The main purpose now is to ensure ARIA label gets updated when translations are ready
    // The actual toggle attachment is separated.
    // applyThemeOnLoad already set the initial theme class.
    // We store the getter to be used when translations are loaded.
    // This function might be simplified if getTranslationsFunc is directly used in updateThemeServiceTranslations
}

export function updateThemeServiceTranslations(newTranslations) {
    currentTranslationObjectForTheme = newTranslations || {};
    updateToggleButtonVisualState(document.body.classList.contains('dark-theme'));
}
