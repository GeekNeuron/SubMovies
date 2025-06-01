// src/js/core/i18nService.js
console.log("i18nService.js: Script loaded."); // DEBUG

import * as DOM from '../ui/domElements.js';
import { updateThemeServiceTranslations } from './themeService.js';
import { applySavedTonePreference } from '../ui/settingsController.js';
import { ALLOWED_UI_LANGS, DEFAULT_UI_LANG, LS_LANG } from '../utils/constants.js';

const translations = {};
let currentLang = DEFAULT_UI_LANG; // Initialize with a default

const criticalFallbacks = {
    appTitle: "SubMovies - AI Subtitle Translator",
    appHeaderTitle: "SubMovies AI Translator",
    appSubtitle: "Translate your subtitles effortlessly and with precision.",
    apiKeyLabel: "Gemini API Key:",
    apiKeyPlaceholder: "Paste your Gemini API Key here",
    saveApiKeyLabel: "Save API Key locally",
    modelLabel: "AI Model:",
    modelInfo: "*'Free Tier' models often have usage limits. 'Paid' models typically require a billing-enabled Cloud project. Always verify exact model IDs & terms in official Google documentation.",
    temperatureLabel: "Creativity (Temperature):",
    temperatureTooltip: "Lower (e.g., 0.2) = more deterministic; Higher (e.g., 0.9) = more creative. Default: 0.7",
    toneLabel: "Translation Tone:",
    langTargetLabel: "Target Language:",
    filenameLabel: "Output File Name:",
    filenamePlaceholder: "e.g., MyTranslatedMovie.srt",
    translateBtn: "Translate Subtitles",
    fileChooseLabel: "Upload .srt or .vtt file:",
    fileChooseButtonText: "Choose File",
    fileNone: "No file chosen", // Ensure this has a value for debugging
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
    footerAuthor: "GeekNeuron"
};

function applyActiveTranslations() {
    console.log(`i18nService.js: Applying translations for language: ${currentLang}`); // DEBUG
    const t = translations[currentLang] || translations[DEFAULT_UI_LANG] || criticalFallbacks;
    if (!translations[currentLang]) {
        console.warn(`i18nService.js: Translations for ${currentLang} not actually found in 'translations' object, using fallbacks.`); // DEBUG
    }
    console.log("i18nService.js: Using translation object:", t); // DEBUG

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';
    
    const settingsCard = document.getElementById('settingsCard');
    if (settingsCard) settingsCard.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    document.title = t.appTitle || criticalFallbacks.appTitle;
    
    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appHeaderTitle || criticalFallbacks.appHeaderTitle;
    const appSubtitleEl = document.querySelector('p[data-i18n="appSubtitle"]');
    if(appSubtitleEl) appSubtitleEl.textContent = t.appSubtitle || criticalFallbacks.appSubtitle || "";


    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.id === "appTitleH1" || key === "appSubtitle") return;

        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else {
            const fallbackText = translations[DEFAULT_UI_LANG]?.[key] || criticalFallbacks[key];
            if (fallbackText !== undefined) {
                el.innerText = fallbackText;
                if (currentLang !== DEFAULT_UI_LANG) console.warn(`i18n: Missing key '${key}' for lang '${currentLang}', used default UI lang or critical fallback.`);
            } else {
                el.innerText = `[${key}]`; 
                console.warn(`i18n: Critical - Missing key '${key}' for lang '${currentLang}' and no fallback. Displaying keyname.`);
            }
        }
    });
  
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const placeholderText = t[key] || translations[DEFAULT_UI_LANG]?.[key] || criticalFallbacks[key] || "";
        el.placeholder = placeholderText;
    });
    
    const saveApiKeyLabelEl = document.querySelector(`label[for="${DOM.saveApiKeyCheckbox?.id}"]`);
    if (saveApiKeyLabelEl && t.saveApiKeyLabel) saveApiKeyLabelEl.textContent = t.saveApiKeyLabel;

    if (DOM.downloadBtn && t.downloadBtn) DOM.downloadBtn.textContent = t.downloadBtn;
    
    const copyBtnTextSpan = DOM.copyTranslatedBtn?.querySelector('span:not([role="img"])');
    if (copyBtnTextSpan && t.copyBtnText) {
        copyBtnTextSpan.textContent = ` ${t.copyBtnText}`;
    } else if (DOM.copyTranslatedBtn && t.copyBtnText && DOM.copyTranslatedBtn.childElementCount === 0) {
        DOM.copyTranslatedBtn.textContent = t.copyBtnText;
    }

    const fileInputButtonTextEl = document.getElementById('fileInputButtonText');
    if (fileInputButtonTextEl && t.fileChooseButtonText) {
        fileInputButtonTextEl.textContent = t.fileChooseButtonText;
    } else if (fileInputButtonTextEl) { // Fallback if key missing
        fileInputButtonTextEl.textContent = criticalFallbacks.fileChooseButtonText || "Choose File";
    }
    
    const fileChooseLabelOuterSpan = DOM.fileInputLabelEl?.querySelector('span:not([role="img"])');
     if (fileChooseLabelOuterSpan && t.fileChooseLabel) {
         fileChooseLabelOuterSpan.textContent = ` ${t.fileChooseLabel}`;
     }
    
    const currentFile = DOM.fileInput?.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : criticalFallbacks.fileNone);
    }
  
    if (DOM.responseTitle && t.responseTitle) DOM.responseTitle.textContent = t.responseTitle;
    
    const translatingPlaceholderKey = 'translatingPlaceholder';
    const currentResponseText = DOM.responseBox?.textContent || "";
    const isCurrentlyTranslating = currentResponseText.startsWith("Translating...") || currentResponseText.startsWith("در حال ترجمه...");
    if (DOM.responseBox && isCurrentlyTranslating) {
        DOM.responseBox.textContent = t[translatingPlaceholderKey] !== undefined ? t[translatingPlaceholderKey] : '...';
    }
  
    const tempTooltipKey = 'temperatureTooltip';
    const tempTooltipEl = document.querySelector(`p[data-i18n="${tempTooltipKey}"]`);
    if (tempTooltipEl && t[tempTooltipKey]) tempTooltipEl.textContent = t[tempTooltipKey];

    const modelInfoKey = 'modelInfo';
    const modelInfoEl = document.querySelector(`p[data-i18n="${modelInfoKey}"]`);
    if (modelInfoEl && t[modelInfoKey]) modelInfoEl.textContent = t[modelInfoKey];

    if (DOM.toneSelect) {
        const currentToneValue = DOM.toneSelect.value;
        DOM.toneSelect.innerHTML = ""; 
        const tonesArray = t.tones || translations[DEFAULT_UI_LANG]?.tones || [];
        if (tonesArray.length > 0) {
            let toneFoundInNewLang = false;
            tonesArray.forEach(toneText => {
                const opt = document.createElement("option"); opt.textContent = toneText; opt.value = toneText; 
                if(toneText === currentToneValue) { opt.selected = true; toneFoundInNewLang = true; }
                DOM.toneSelect.appendChild(opt);
            });
            if(!toneFoundInNewLang) { DOM.toneSelect.value = tonesArray[0]; }
            else { DOM.toneSelect.value = currentToneValue; }
        } else {
            const opt = document.createElement("option");
            opt.textContent = "---"; opt.disabled = true;
            DOM.toneSelect.appendChild(opt);
            console.warn("i18nService.js: No tones found for current language or fallback."); // DEBUG
        }
    }
    applySavedTonePreference(); // Apply after populating

    if (DOM.modelSelect && t.models) {
        Array.from(DOM.modelSelect.options).forEach(opt => {
            const modelKey = opt.value; 
            if (t.models[modelKey]) { opt.textContent = t.models[modelKey]; }
        });
    }
    
    updateThemeServiceTranslations(t); 
    if (typeof window.updateCharCountGlobal === 'function') {
        window.updateCharCountGlobal();
    }
    updateLanguageSwitcherUI();
    console.log("i18nService.js: Translations applied."); // DEBUG
}

export async function loadLanguage(lang) {
    console.log(`i18nService.js: Attempting to load language: ${lang}`); // DEBUG
    if (!ALLOWED_UI_LANGS.includes(lang)) {
        console.warn(`i18nService.js: Attempted to load unsupported language: ${lang}. Defaulting to ${currentLang}.`);
        lang = currentLang; 
    }
    const langFilePath = `src/lang/${lang}.json?v=debug_logs_1`; 
    try {
        const response = await fetch(langFilePath);
        if (!response.ok) {
            console.error(`i18nService.js: HTTP error ${response.status} for ${langFilePath}`); // DEBUG
            throw new Error(`HTTP error ${response.status} for ${langFilePath}`);
        }
        translations[lang] = await response.json();
        currentLang = lang;
        console.log(`i18nService.js: Successfully loaded and parsed ${lang}.json. Translations object for ${lang}:`, translations[lang]); // DEBUG
        applyActiveTranslations();
        localStorage.setItem(LS_LANG, lang);
    } catch (error) {
        console.error(`i18nService.js: Failed to load language ${lang} from ${langFilePath}:`, error); // DEBUG
        if (lang !== DEFAULT_UI_LANG) {
            const errorMsg = `Could not load translations for selected language (${lang}). Reverting to default (${DEFAULT_UI_LANG}).`;
            if(typeof showToast === 'function') showToast(errorMsg, 'error'); else console.error(errorMsg);

            if (translations[DEFAULT_UI_LANG]) { 
                currentLang = DEFAULT_UI_LANG; 
                applyActiveTranslations(); 
                updateLanguageSwitcherUI();
            } else { 
                await loadLanguage(DEFAULT_UI_LANG); 
            }
        } else if (!translations[DEFAULT_UI_LANG]) { 
            console.error("i18nService.js: CRITICAL - Default UI language file also failed to load."); // DEBUG
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Critical error: Core language files could not be loaded.</p>";
        }
    }
}

export async function initializeI18n() {
    console.log("i18nService.js: Initializing i18n..."); // DEBUG
    const savedLang = localStorage.getItem(LS_LANG) || navigator.language.split('-')[0] || DEFAULT_UI_LANG;
    let langToLoad = ALLOWED_UI_LANGS.includes(savedLang) ? savedLang : DEFAULT_UI_LANG; 
    console.log(`i18nService.js: Initial language to load: ${langToLoad}`); // DEBUG
    await loadLanguage(langToLoad);
}

export function getCurrentTranslations() {
    // console.log("i18nService.js: getCurrentTranslations called for lang:", currentLang); // DEBUG - Can be very noisy
    return translations[currentLang] || translations[DEFAULT_UI_LANG] || criticalFallbacks;
}

export function applyCurrentTranslations() { 
    console.log("i18nService.js: applyCurrentTranslations explicitly called."); // DEBUG
    applyActiveTranslations();
}

function updateLanguageSwitcherUI() {
    const enButton = document.getElementById('langToggleEn');
    const faButton = document.getElementById('langToggleFa');
    if (enButton && faButton) {
        enButton.classList.toggle('active', currentLang === 'en');
        faButton.classList.toggle('active', currentLang === 'fa');
        enButton.setAttribute('aria-pressed', currentLang === 'en');
        faButton.setAttribute('aria-pressed', currentLang === 'fa');
        console.log(`i18nService.js: Language switcher UI updated. Current lang: ${currentLang}`); // DEBUG
    } else {
        console.warn("i18nService.js: Language toggle buttons not found for UI update."); // DEBUG
    }
}

export function setupLanguageSwitcher() {
    console.log("i18nService.js: Setting up language switcher event listeners."); // DEBUG
    const enButton = document.getElementById('langToggleEn');
    const faButton = document.getElementById('langToggleFa');

    const switchLang = (langCode) => {
        console.log(`i18nService.js: switchLang called with code: ${langCode}`); // DEBUG
        if (currentLang !== langCode && ALLOWED_UI_LANGS.includes(langCode)) {
            localStorage.setItem(LS_LANG, langCode);
            loadLanguage(langCode); 
        } else {
            console.log(`i18nService.js: Language ${langCode} is already current or not allowed.`); // DEBUG
        }
    };

    if (enButton) enButton.addEventListener('click', () => switchLang('en'));
    else console.warn("i18nService.js: English toggle button not found."); // DEBUG

    if (faButton) faButton.addEventListener('click', () => switchLang('fa'));
    else console.warn("i18nService.js: Persian toggle button not found."); // DEBUG
    
    updateLanguageSwitcherUI(); 
}
