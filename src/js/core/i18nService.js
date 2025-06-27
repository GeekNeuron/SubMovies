// src/js/core/i18nService.js
import { loadAndApplyAllSettings } from '../ui/settingsController.js';
import { updateThemeServiceTranslations } from './themeService.js';

let translations = {};

// Fallback object in case fa.json fails to load
const criticalFallbacks = {
    appHeaderTitle: "مترجم هوشمند SubMovies",
    // Add a few more critical texts here if you want extra safety
};

/**
 * Applies the translations from the loaded fa.json file.
 */
function applyActiveTranslations() {
    const t = translations['fa'] || criticalFallbacks;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerText = t[key] || `[${key}]`;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t[key] || `[${key}]`;
    });

    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        el.textContent = t[key] || '';
    });
    
    updateThemeServiceTranslations(t);

    if (typeof loadAndApplyAllSettings === 'function') {
        loadAndApplyAllSettings();
    }
}

/**
 * Initializes the internationalization service by loading the Persian language file.
 */
export async function initializeI18n() {
    try {
        const response = await fetch(`src/lang/fa.json?v=final`);
        if (!response.ok) throw new Error('Network response was not ok');
        translations['fa'] = await response.json();
    } catch (error) {
        console.error("Fatal Error: Could not load Persian language file (fa.json).", error);
        document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>خطای حیاتی: فایل زبان فارسی بارگذاری نشد.</p>";
        return; // Stop execution if language file fails
    }
    applyActiveTranslations();
}

/**
 * Returns the current (Persian) translations.
 */
export function getCurrentTranslations() {
    return translations['fa'] || criticalFallbacks;
}
