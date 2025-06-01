// src/js/core/i18nService.js
import * as DOM from '../ui/domElements.js';
import { updateThemeServiceTranslations } from './themeService.js';
import { applySavedTonePreference } from '../ui/settingsController.js'; // To apply saved tone after lang change
import { ALLOWED_UI_LANGS, DEFAULT_UI_LANG, LS_LANG } from '../utils/constants.js';

const translations = {};
let currentLang = DEFAULT_UI_LANG;

const criticalFallbacks = { /* ... (same as before) ... */
    appTitle: "Gemini Subtitle Translator",
    appHeaderTitle: "SubMovies AI Translator",
    appSubtitle: "Translate your subtitles effortlessly and with precision.",
    apiKeyLabel: "Gemini API Key:",
    apiKeyPlaceholder: "Paste your Gemini API Key here",
    modelLabel: "AI Model:",
    translateBtn: "Translate Subtitles",
    fileChooseLabel: "Upload .srt or .vtt file:",
    fileNone: "",
    originalTitle: "Original",
    translatedTitle: "Translated",
    responseTitle: "Translation Comparison",
    copyBtnText: "Copy",
    // ...
};

function applyActiveTranslations() {
    const t = translations[currentLang] || translations[DEFAULT_UI_LANG] || criticalFallbacks;

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';
    
    const formContainer = document.getElementById('settingsCard'); // Main card
    if (formContainer) formContainer.dir = (currentLang === 'fa') ? 'rtl' : 'ltr'; // Ensure card dir is set

    document.title = t.appTitle || criticalFallbacks.appTitle;
    
    // Update specific elements by ID if they exist
    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appHeaderTitle || criticalFallbacks.appHeaderTitle;
    const appSubtitleEl = document.querySelector('p[data-i18n="appSubtitle"]');
    if(appSubtitleEl) appSubtitleEl.textContent = t.appSubtitle || "";


    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Skip elements already handled specifically (like appTitleH1, appSubtitle)
        if (el.id === "appTitleH1" || el.getAttribute('data-i18n') === "appSubtitle") return;

        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else if (key === 'fileNone' && el.id === 'fileNameText') {
            el.innerText = ''; 
        } else if (translations[DEFAULT_UI_LANG]?.[key] !== undefined) {
            el.innerText = translations[DEFAULT_UI_LANG][key]; 
            if (currentLang !== DEFAULT_UI_LANG) console.warn(`i18n: Missing key '${key}' for lang '${currentLang}', used default UI lang fallback.`);
        } else {
            // console.warn(`i18n: Critical - Missing key '${key}' for lang '${currentLang}' and no default UI lang fallback.`);
        }
    });
  
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) el.placeholder = t[key];
        else if (translations[DEFAULT_UI_LANG]?.[key] !== undefined) el.placeholder = translations[DEFAULT_UI_LANG][key];
    });
  
    if (DOM.apiKeyInput && t.apiKeyPlaceholder) DOM.apiKeyInput.placeholder = t.apiKeyPlaceholder;
    if (DOM.promptInput && t.promptPlaceholder) DOM.promptInput.placeholder = t.promptPlaceholder;
    if (DOM.filenameInput && t.filenamePlaceholder) DOM.filenameInput.placeholder = t.filenamePlaceholder;
    
    const saveApiKeyLabelEl = document.querySelector(`label[for="${DOM.saveApiKeyCheckbox?.id}"]`);
    if (saveApiKeyLabelEl && t.saveApiKeyLabel) saveApiKeyLabelEl.textContent = t.saveApiKeyLabel;

    if (DOM.downloadBtn && t.downloadBtn) DOM.downloadBtn.textContent = t.downloadBtn;
    
    const copyBtnTextSpan = DOM.copyTranslatedBtn?.querySelector('span:not([role="img"])');
    if (copyBtnTextSpan && t.copyBtnText) {
        copyBtnTextSpan.textContent = t.copyBtnText;
    } else if (DOM.copyTranslatedBtn && t.copyBtnText && DOM.copyTranslatedBtn.childElementCount === 0) {
        DOM.copyTranslatedBtn.textContent = t.copyBtnText;
    }


    const fileChooseLabelSpan = DOM.fileInputLabelEl?.querySelector('span:not([role="img"])');
    if (fileChooseLabelSpan && t.fileChooseLabel) {
        fileChooseLabelSpan.textContent = ` ${t.fileChooseLabel}`; // Add space after icon
    } else if (DOM.fileInputLabelEl && t.fileChooseLabel && DOM.fileInputLabelEl.children.length > 0 && DOM.fileInputLabelEl.lastChild.nodeType === Node.TEXT_NODE) {
         DOM.fileInputLabelEl.lastChild.textContent = ` ${t.fileChooseLabel}`;
    }
    
    const currentFile = DOM.fileInput?.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
    }
  
    if (DOM.responseTitle && t.responseTitle) DOM.responseTitle.textContent = t.responseTitle;
    
    const translatingPlaceholderKey = 'translatingPlaceholder';
    if (DOM.responseBox && DOM.responseBox.textContent && DOM.responseBox.textContent.includes("Translating")) { // Check if it currently shows "Translating..."
        DOM.responseBox.textContent = t[translatingPlaceholderKey] !== undefined ? t[translatingPlaceholderKey] : '...';
    }
  
    const tempTooltipKey = 'temperatureTooltip';
    const tempTooltipEl = document.querySelector(`p[data-i18n="${tempTooltipKey}"]`);
    if (tempTooltipEl && t[tempTooltipKey]) tempTooltipEl.textContent = t[tempTooltipKey];

    const modelInfoKey = 'modelInfo';
    const modelInfoEl = document.querySelector(`p[data-i18n="${modelInfoKey}"]`);
    if (modelInfoEl && t[modelInfoKey]) modelInfoEl.textContent = t[modelInfoKey];

    if (t.tones && DOM.toneSelect) {
        const currentToneValue = DOM.toneSelect.value;
        DOM.toneSelect.innerHTML = ""; 
        let toneFound = false;
        t.tones.forEach(toneText => {
            const opt = document.createElement("option"); opt.textContent = toneText; opt.value = toneText; 
            if(toneText === currentToneValue) { opt.selected = true; toneFound = true; }
            DOM.toneSelect.appendChild(opt);
        });
        if(!toneFound && t.tones.length > 0) { DOM.toneSelect.value = t.tones[0]; }
        else if (toneFound) { DOM.toneSelect.value = currentToneValue; } // Restore if found
    }
     // After tones are populated, apply saved preference
    applySavedTonePreference();


    if (t.models && DOM.modelSelect) {
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
}

export async function loadLanguage(lang) {
    if (!ALLOWED_UI_LANGS.includes(lang)) {
        console.warn(`Attempted to load unsupported language: ${lang}. Defaulting to ${currentLang}.`);
        lang = currentLang; 
    }
    const langFilePath = `src/lang/${lang}.json?v=ui_revamp_final`; 
    try {
        const response = await fetch(langFilePath);
        if (!response.ok) throw new Error(`HTTP error ${response.status} for ${langFilePath}`);
        translations[lang] = await response.json();
        currentLang = lang;
        applyActiveTranslations();
        localStorage.setItem(LS_LANG, lang);
    } catch (error) {
        console.error(`Failed to load language ${lang} from ${langFilePath}:`, error);
        if (lang !== DEFAULT_UI_LANG) {
            showToast(`Could not load translations for selected language. Reverting to default.`, 'error');
            if (translations[DEFAULT_UI_LANG]) { // If default (e.g. English) is already loaded
                currentLang = DEFAULT_UI_LANG; 
                applyActiveTranslations(); 
                updateLanguageSwitcherUI();
            } else { 
                await loadLanguage(DEFAULT_UI_LANG); // Attempt to load default language
            }
        } else if (!translations[DEFAULT_UI_LANG]) { 
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Critical error: Core language files could not be loaded.</p>";
        }
    }
}

export async function initializeI18n() {
    const savedLang = localStorage.getItem(LS_LANG) || navigator.language.split('-')[0] || DEFAULT_UI_LANG;
    let langToLoad = ALLOWED_UI_LANGS.includes(savedLang) ? savedLang : DEFAULT_UI_LANG; 

    await loadLanguage(langToLoad); // Load and apply the initial language
}

export function getCurrentTranslations() {
    return translations[currentLang] || translations[DEFAULT_UI_LANG] || criticalFallbacks;
}

export function applyCurrentTranslations() { 
    applyActiveTranslations();
}

function updateLanguageSwitcherUI() {
    const enButton = document.getElementById('langToggleEn');
    const faButton = document.getElementById('langToggleFa');
    if (enButton && faButton) {
        enButton.classList.toggle('active', currentLang === 'en');
        faButton.classList.toggle('active', currentLang === 'fa');
    }
}

export function setupLanguageSwitcher() {
    const enButton = document.getElementById('langToggleEn');
    const faButton = document.getElementById('langToggleFa');

    if (enButton) {
        enButton.addEventListener('click', () => {
            if (currentLang !== 'en') {
                localStorage.setItem(LS_LANG, 'en');
                loadLanguage('en');
            }
        });
    }
    if (faButton) {
        faButton.addEventListener('click', () => {
            if (currentLang !== 'fa') {
                localStorage.setItem(LS_LANG, 'fa');
                loadLanguage('fa');
            }
        });
    }
    updateLanguageSwitcherUI(); // Set initial active state
}
