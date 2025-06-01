// src/js/core/i18nService.js
import * as DOM from '../ui/domElements.js';
import { updateThemeServiceTranslations } from './themeService.js';
import { applySavedTonePreference } from '../ui/settingsController.js';
import { ALLOWED_UI_LANGS, DEFAULT_UI_LANG, LS_LANG } from '../utils/constants.js';

const translations = {};
let currentLang = DEFAULT_UI_LANG;

const criticalFallbacks = {
    appTitle: "SubMovies - AI Subtitle Translator",
    appHeaderTitle: "SubMovies AI Translator",
    appSubtitle: "Translate your subtitles effortlessly and with precision.",
    apiKeyLabel: "Gemini API Key:",
    modelLabel: "AI Model:",
    translateBtn: "Translate Subtitles",
    fileChooseLabel: "Upload .srt or .vtt file:",
    fileChooseButtonText: "Select File", // Fallback for the new button text
    fileNone: "", 
    originalTitle: "Original",
    translatedTitle: "Translated",
    responseTitle: "Translation Comparison",
    copyBtnText: "Copy",
    translatingPlaceholder: "Translating...",
    closeBtnLabel: "Close",
    // Add more as needed
};

function applyActiveTranslations() {
    const t = translations[currentLang] || translations[DEFAULT_UI_LANG] || criticalFallbacks;

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';
    
    const settingsCard = document.getElementById('settingsCard');
    if (settingsCard) settingsCard.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    document.title = t.appTitle || criticalFallbacks.appTitle;
    
    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appHeaderTitle || criticalFallbacks.appHeaderTitle;
    const appSubtitleEl = document.querySelector('p[data-i18n="appSubtitle"]');
    if(appSubtitleEl) appSubtitleEl.textContent = t.appSubtitle || criticalFallbacks.appSubtitle;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.id === "appTitleH1" || key === "appSubtitle") return; // Already handled

        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else {
            const fallbackText = translations[DEFAULT_UI_LANG]?.[key];
            if (fallbackText !== undefined) {
                el.innerText = fallbackText;
                if (currentLang !== DEFAULT_UI_LANG) console.warn(`i18n: Missing key '${key}' for lang '${currentLang}', used default UI lang fallback.`);
            } else {
                // If still not found, keep original HTML text or show key for debugging
                // el.innerText = `[${key}]`; // For debugging
                console.warn(`i18n: Critical - Missing key '${key}' for lang '${currentLang}' and no default UI lang fallback. HTML text kept or key shown.`);
            }
        }
    });
  
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) el.placeholder = t[key];
        else if (translations[DEFAULT_UI_LANG]?.[key] !== undefined) el.placeholder = translations[DEFAULT_UI_LANG][key];
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

    // For the new file input button text
    const fileInputButtonTextEl = document.getElementById('fileInputButtonText');
    if (fileInputButtonTextEl && t.fileChooseButtonText) {
        fileInputButtonTextEl.textContent = t.fileChooseButtonText;
    } else if (fileInputButtonTextEl && translations[DEFAULT_UI_LANG]?.fileChooseButtonText) {
        fileInputButtonTextEl.textContent = translations[DEFAULT_UI_LANG].fileChooseButtonText;
    } else if (fileInputButtonTextEl) {
        fileInputButtonTextEl.textContent = "Select File"; // Hardcoded fallback
    }


    const fileChooseLabelOuterSpan = DOM.fileInputLabelEl?.querySelector('span:not([role="img"])');
     if (fileChooseLabelOuterSpan && t.fileChooseLabel) {
         fileChooseLabelOuterSpan.textContent = ` ${t.fileChooseLabel}`;
     }
    
    const currentFile = DOM.fileInput?.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
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

    // Ensure Tone select is populated correctly
    if (DOM.toneSelect) { // Check if element exists
        const currentToneValue = DOM.toneSelect.value;
        DOM.toneSelect.innerHTML = ""; // Clear previous options
        
        const tonesArray = t.tones || translations[DEFAULT_UI_LANG]?.tones || []; // Fallback to English tones
        if (tonesArray.length > 0) {
            let toneFoundInNewLang = false;
            tonesArray.forEach(toneText => {
                const opt = document.createElement("option"); 
                opt.textContent = toneText; 
                opt.value = toneText; 
                if(toneText === currentToneValue) { 
                    opt.selected = true; 
                    toneFoundInNewLang = true; 
                }
                DOM.toneSelect.appendChild(opt);
            });
            if(!toneFoundInNewLang) { 
                DOM.toneSelect.value = tonesArray[0]; 
            } else {
                 DOM.toneSelect.value = currentToneValue; // Restore if found
            }
        } else { // No tones defined, show a placeholder option
            const opt = document.createElement("option");
            opt.textContent = "---"; // Or a translated "No tones available"
            opt.disabled = true;
            DOM.toneSelect.appendChild(opt);
            console.warn("i18n: No tones found for current language or fallback.");
        }
    }
    applySavedTonePreference(); // Apply saved preference after options are populated

    if (t.models && DOM.modelSelect) {
        Array.from(DOM.modelSelect.options).forEach(opt => {
            const modelKey = opt.value; 
            if (t.models[modelKey]) { opt.textContent = t.models[modelKey]; }
            // else: keep HTML default text for the option if not found in lang file
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
    const langFilePath = `src/lang/${lang}.json?v=ui_final_fix`; 
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
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Critical error: Core language files could not be loaded.</p>";
        }
    }
}

export async function initializeI18n() {
    const savedLang = localStorage.getItem(LS_LANG) || navigator.language.split('-')[0] || DEFAULT_UI_LANG;
    let langToLoad = ALLOWED_UI_LANGS.includes(savedLang) ? savedLang : DEFAULT_UI_LANG; 
    await loadLanguage(langToLoad);
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
        enButton.setAttribute('aria-pressed', currentLang === 'en');
        faButton.setAttribute('aria-pressed', currentLang === 'fa');
    }
}

export function setupLanguageSwitcher() {
    const enButton = document.getElementById('langToggleEn');
    const faButton = document.getElementById('langToggleFa');

    const switchLang = (langCode) => {
        if (currentLang !== langCode && ALLOWED_UI_LANGS.includes(langCode)) { // Check if langCode is allowed
            localStorage.setItem(LS_LANG, langCode);
            loadLanguage(langCode); 
        }
    };

    if (enButton) enButton.addEventListener('click', () => switchLang('en'));
    if (faButton) faButton.addEventListener('click', () => switchLang('fa'));
    
    updateLanguageSwitcherUI(); 
}
