// src/js/core/i18nService.js
console.log("i18nService.js: Script loaded.");

import * as DOM from '../ui/domElements.js';
import { updateThemeServiceTranslations } from './themeService.js';
import { loadAndApplyAllSettings } from '../ui/settingsController.js';
import { ALLOWED_UI_LANGS, DEFAULT_UI_LANG, LS_LANG } from '../utils/constants.js';

const translations = {};
let currentLang = DEFAULT_UI_LANG;

// ✅ MODIFICATION: Added new keys for tooltips to the fallback object.
const criticalFallbacks = {
    appTitle: "SubMovies - AI Subtitle Translator",
    appHeaderTitle: "SubMovies AI Translator",
    appSubtitle: "Translate your subtitles effortlessly and with precision.",
    apiKeyLabel: "Gemini API Key:",
    apiKeyPlaceholder: "Paste your Gemini API Key here",
    saveApiKeyLabel: "Save API Key locally",
    modelLabel: "AI Model:",
    temperatureLabel: "Creativity (Temperature):",
    toneLabel: "Translation Tone:",
    langTargetLabel: "Target Language:",
    filenameLabel: "Output File Name:",
    filenamePlaceholder: "e.g., MyTranslatedMovie.srt",
    translateBtn: "Translate Subtitles",
    fileChooseLabel: "Upload .srt or .vtt file:",
    fileChooseButtonText: "Choose File",
    fileNone: "No file chosen",
    fileValidationSRTError: "Invalid SRT file. Please check format.",
    fileValidationVTTError: "Invalid VTT file. Missing WEBVTT header or malformed.",
    unsupportedFileType: "Unsupported file type. Please upload .srt or .vtt.",
    fileReadError: "Error reading file. It might be corrupted or too large.",
    charCountLabel: "Characters: {count}",
    charCountWarning: "Warning: Very long text may take more time or hit API limits.",
    promptPlaceholder: "Or paste subtitle text here (SRT or VTT format recognized)",
    errorMissing: "API Key and Subtitle Text are required.",
    errorAPI: "Gemini API Error: {message}",
    errorNetwork: "Network error. Please check your connection.",
    errorUnknown: "An unknown error occurred. Please try again.",
    errorNoDownloadText: "No translated text available to download.",
    downloadBtn: "Download Translated File",
    copyBtnText: "Copy",
    copySuccess: "Copied to clipboard!",
    copyFail: "Failed to copy text.",
    translatingPlaceholder: "Translating... please wait.",
    responseTitle: "Translation Comparison",
    originalTitle: "Original Text",
    translatedTitle: "Translated Text",
    themeToggleLight: "Switch to Light Mode",
    themeToggleDark: "Switch to Dark Mode",
    closeBtnLabel: "Close",
    footerMadeWith: "Made with",
    footerBy: "by",
    footerAuthor: "GeekNeuron",
    // New Tooltip Fallbacks
    apiKeyTooltip: "Enter your API key from Google AI Studio. The key is required to connect to the Gemini API.",
    saveApiKeyTooltip: "If checked, your API key will be saved securely in your browser's local storage for future visits. Uncheck to remove it.",
    modelTooltip: "*'Free Tier' models often have usage limits. 'Paid' models typically require a billing-enabled Cloud project. Always verify exact model IDs & terms in official Google documentation.",
    temperatureTooltip: "Lower values (e.g., 0.2) result in more predictable, deterministic translations. Higher values (e.g., 0.9) encourage more creative and diverse wording. Default: 0.7.",
    toneTooltip: "Choose the desired style and tone for the translated dialogue to match the content's context.",
    targetLangTooltip: "Select the language you want to translate the subtitles into.",
    uploadFileTooltip: "Click to upload a subtitle file in .srt or .vtt format from your device.",
    outputFileNameTooltip: "Enter a custom name for the translated file. If left blank, a name will be generated automatically."
};

function applyActiveTranslations() {
    console.log(`i18nService.js: Applying translations for language: ${currentLang}`);
    const t = translations[currentLang] || criticalFallbacks;

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    const settingsCard = document.getElementById('settingsCard');
    if (settingsCard) settingsCard.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    document.title = t.appTitle || criticalFallbacks.appTitle;

    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appHeaderTitle || criticalFallbacks.appHeaderTitle;
    const appSubtitleEl = document.querySelector('p[data-i18n="appSubtitle"]');
    if (appSubtitleEl) appSubtitleEl.textContent = t.appSubtitle || criticalFallbacks.appSubtitle || "";


    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.id === "appTitleH1" || key === "appSubtitle") return;
        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else {
            const fallbackText = criticalFallbacks[key];
            if (fallbackText !== undefined) {
                el.innerText = fallbackText;
            } else {
                el.innerText = `[${key}]`;
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const placeholderText = t[key] || criticalFallbacks[key] || "";
        el.placeholder = placeholderText;
    });

    // ✅ NEW: Add loop to find and populate all tooltip elements.
    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        el.textContent = t[key] || criticalFallbacks[key] || '';
    });

    const currentFile = DOM.fileInput?.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : criticalFallbacks.fileNone);
    }
    
    updateThemeServiceTranslations(t);
    if (typeof window.updateCharCountGlobal === 'function') {
        window.updateCharCountGlobal();
    }

    if (typeof loadAndApplyAllSettings === 'function') {
        loadAndApplyAllSettings();
    }

    updateLanguageSwitcherUI();
    console.log("i18nService.js: Translations applied.");
}

export async function loadLanguage(lang) {
    console.log(`i18nService.js: Attempting to load language: ${lang}`);
    if (!ALLOWED_UI_LANGS.includes(lang)) {
        console.warn(`i18nService.js: Attempted to load unsupported language: ${lang}. Defaulting to ${currentLang}.`);
        lang = currentLang;
    }
    const langFilePath = `src/lang/${lang}.json?v=2`;
    try {
        const response = await fetch(langFilePath);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} for ${langFilePath}`);
        }
        translations[lang] = await response.json();
        currentLang = lang;
        applyActiveTranslations();
        localStorage.setItem(LS_LANG, lang);
    } catch (error) {
        console.error(`i18nService.js: Failed to load language ${lang} from ${langFilePath}:`, error);
        if (lang !== DEFAULT_UI_LANG) {
            if (translations[DEFAULT_UI_LANG]) {
                currentLang = DEFAULT_UI_LANG;
                applyActiveTranslations();
                updateLanguageSwitcherUI();
            } else {
                await loadLanguage(DEFAULT_UI_LANG);
            }
        } else {
            console.error("i18nService.js: CRITICAL - Default UI language file also failed to load.");
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Critical error: Core language files could not be loaded.</p>";
        }
    }
}

export async function initializeI18n() {
    console.log("i18nService.js: Initializing i18n...");
    const savedLang = localStorage.getItem(LS_LANG) || navigator.language.split('-')[0] || DEFAULT_UI_LANG;
    let langToLoad = ALLOWED_UI_LANGS.includes(savedLang) ? savedLang : DEFAULT_UI_LANG;
    console.log(`i18nService.js: Initial language to load: ${langToLoad}`);
    await loadLanguage(langToLoad);
}

export function getCurrentTranslations() {
    return translations[currentLang] || criticalFallbacks;
}

export function applyCurrentTranslations() {
    console.log("i18nService.js: applyCurrentTranslations explicitly called.");
    applyActiveTranslations();
}

function updateLanguageSwitcherUI() {
    const enTab = document.getElementById('langToggleEn');
    const faTab = document.getElementById('langToggleFa');
    if (enTab && faTab) {
        enTab.classList.toggle('active', currentLang === 'en');
        faTab.classList.toggle('active', currentLang === 'fa');
    } else {
        console.warn("i18nService.js: Language toggle tabs not found for UI update.");
    }
}

export function setupLanguageSwitcher() {
    console.log("i18nService.js: Setting up language switcher event listeners.");
    const switcherContainer = document.getElementById('langSwitcherContainer');

    if (switcherContainer) {
        switcherContainer.addEventListener('click', (event) => {
            const target = event.target.closest('.lang-tab');
            if (target) {
                const langCode = target.dataset.lang;
                if (currentLang !== langCode && ALLOWED_UI_LANGS.includes(langCode)) {
                    localStorage.setItem(LS_LANG, langCode);
                    loadLanguage(langCode);
                }
            }
        });
    } else {
        console.warn("i18nService.js: Language switcher container not found.");
    }
    updateLanguageSwitcherUI();
}
