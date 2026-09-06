// src/js/core/i18nService.js
import { loadAndApplyAllSettings } from '../ui/settingsController.js';
import { updateThemeServiceTranslations } from './themeService.js';
import { SUPPORTED_LANGUAGES, getLanguageInfo, isRTL } from '../utils/languages.js';
import { LS_UI_LANG } from '../utils/constants.js';

const DEFAULT_UI_LANG = 'fa';

let translations = {}; // cache: { [langCode]: {...} }
let currentLang = DEFAULT_UI_LANG;

// Fallback object in case the language file fails to load
const criticalFallbacks = {
    appHeaderTitle: "SubMovies",
};

/**
 * Figures out which language to boot with: saved preference, then the
 * browser's language (if we support it), then the default.
 */
function detectInitialLanguage() {
    const saved = localStorage.getItem(LS_UI_LANG);
    if (saved && getLanguageInfo(saved)) return saved;

    const browserLangs = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ''];

    for (const bl of browserLangs) {
        const prefix = (bl || '').slice(0, 2).toLowerCase();
        if (getLanguageInfo(prefix)) return prefix;
    }
    return DEFAULT_UI_LANG;
}

/**
 * Applies the currently-loaded translations to the DOM, and updates
 * html[lang]/html[dir] to match the active language's writing direction.
 */
function applyActiveTranslations() {
    const t = translations[currentLang] || criticalFallbacks;

    document.documentElement.lang = currentLang;
    document.documentElement.dir = isRTL(currentLang) ? 'rtl' : 'ltr';

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

    // The UI-language switcher button shows the *current* language's native name
    const languageSelectBtn = document.getElementById('languageSelectBtn');
    if (languageSelectBtn) {
        const info = getLanguageInfo(currentLang);
        languageSelectBtn.textContent = `🌐 ${info ? info.name : currentLang}`;
    }

    updateThemeServiceTranslations(t);

    if (typeof loadAndApplyAllSettings === 'function') {
        loadAndApplyAllSettings();
    }

    // fileController.js exposes this hook (window.updateCharCountGlobal) so the
    // character-count label re-translates when the UI language changes.
    if (typeof window.updateCharCountGlobal === 'function') {
        window.updateCharCountGlobal();
    }
    // Same pattern for the "no file chosen" placeholder text.
    if (typeof window.refreshFileNameTranslationGlobal === 'function') {
        window.refreshFileNameTranslationGlobal();
    }
    // Same pattern for the manual translation editor's row placeholders.
    if (typeof window.refreshManualEditorTranslationsGlobal === 'function') {
        window.refreshManualEditorTranslationsGlobal();
    }
    // Same pattern for the translate/resume button's dynamic label.
    if (typeof window.refreshTranslateButtonLabelGlobal === 'function') {
        window.refreshTranslateButtonLabelGlobal();
    }
}

/**
 * Loads (and caches) a language file if it isn't already loaded.
 */
async function loadLanguage(langCode) {
    if (translations[langCode]) return translations[langCode];

    const response = await fetch(`src/lang/${langCode}.json?v=2`);
    if (!response.ok) throw new Error(`Failed to load language file for "${langCode}"`);
    const data = await response.json();
    translations[langCode] = data;
    return data;
}

/**
 * Initializes the internationalization service: detects/loads the initial
 * UI language and applies it to the DOM.
 */
export async function initializeI18n() {
    const initialLang = detectInitialLanguage();
    try {
        await loadLanguage(initialLang);
        currentLang = initialLang;
    } catch (error) {
        console.error(`Fatal Error: Could not load language file for "${initialLang}".`, error);
        // Try falling back to the default language if a different one failed
        if (initialLang !== DEFAULT_UI_LANG) {
            try {
                await loadLanguage(DEFAULT_UI_LANG);
                currentLang = DEFAULT_UI_LANG;
            } catch (fallbackError) {
                document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Fatal error: could not load any language file.</p>";
                return;
            }
        } else {
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Fatal error: could not load any language file.</p>";
            return;
        }
    }
    applyActiveTranslations();
}

/**
 * Switches the active UI language, loading its file on demand, persisting
 * the choice, and re-applying all translations.
 * @param {string} langCode
 */
export async function switchUILanguage(langCode) {
    if (!getLanguageInfo(langCode)) return;
    if (langCode === currentLang) return;
    try {
        await loadLanguage(langCode);
        currentLang = langCode;
        localStorage.setItem(LS_UI_LANG, langCode);
        applyActiveTranslations();
    } catch (error) {
        console.error(`Could not switch to language "${langCode}".`, error);
    }
}

/**
 * Returns the current UI translations object.
 */
export function getCurrentTranslations() {
    return translations[currentLang] || criticalFallbacks;
}

/**
 * Returns the current UI language code (e.g. 'fa', 'en').
 */
export function getCurrentLanguageCode() {
    return currentLang;
}

export { SUPPORTED_LANGUAGES };
