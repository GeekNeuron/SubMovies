// src/js/core/i18nService.js
import * as DOM from '../ui/domElements.js';
import { updateThemeServiceTranslations } from './themeService.js';
import { applySavedTonePreference } from '../ui/settingsController.js';
import { ALLOWED_UI_LANGS, DEFAULT_UI_LANG, LS_LANG } from '../utils/constants.js';

const translations = {};
let currentLang = DEFAULT_UI_LANG; // Set a default that will be overridden

const criticalFallbacks = {
    appTitle: "SubMovies - AI Subtitle Translator",
    appHeaderTitle: "SubMovies AI Translator",
    appSubtitle: "Translate your subtitles effortlessly and with precision.",
    apiKeyLabel: "Gemini API Key:",
    apiKeyPlaceholder: "Paste your Gemini API Key here",
    modelLabel: "AI Model:",
    translateBtn: "Translate Subtitles",
    fileChooseLabel: "Upload .srt or .vtt file:",
    fileNone: "", // Default to empty if no key
    originalTitle: "Original",
    translatedTitle: "Translated",
    responseTitle: "Translation Comparison",
    copyBtnText: "Copy",
    translatingPlaceholder: "Translating...",
    // ... add other absolutely critical fallbacks if needed
};

function applyActiveTranslations() {
    const t = translations[currentLang] || translations[DEFAULT_UI_LANG] || criticalFallbacks;

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';
    
    const settingsCard = document.getElementById('settingsCard'); // Main card
    if (settingsCard) settingsCard.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    document.title = t.appTitle || criticalFallbacks.appTitle;
    
    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appHeaderTitle || criticalFallbacks.appHeaderTitle;
    const appSubtitleEl = document.querySelector('p[data-i18n="appSubtitle"]');
    if(appSubtitleEl) appSubtitleEl.textContent = t.appSubtitle || "";


    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Skip elements handled more specifically above or if they are containers for other i18n elements
        if (el.id === "appTitleH1" || key === "appSubtitle") return;

        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else {
            const fallbackText = translations[DEFAULT_UI_LANG]?.[key];
            if (fallbackText !== undefined) {
                el.innerText = fallbackText;
                if (currentLang !== DEFAULT_UI_LANG) console.warn(`i18n: Missing key '${key}' for lang '${currentLang}', used default UI lang fallback.`);
            } else {
                // If still not found, leave original HTML text or show key for debugging
                 el.innerText = `[${key}]`; // For debugging missing keys
                console.warn(`i18n: Critical - Missing key '${key}' for lang '${currentLang}' and no default UI lang fallback. Displaying keyname.`);
            }
        }
    });
  
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) el.placeholder = t[key];
        else if (translations[DEFAULT_UI_LANG]?.[key] !== undefined) el.placeholder = translations[DEFAULT_UI_LANG][key];
        // else keep original placeholder from HTML
    });
  
    // Specific elements that might not use data-i18n for all properties
    // These are already handled by data-i18n-placeholder for inputs
    // if (DOM.apiKeyInput && t.apiKeyPlaceholder) DOM.apiKeyInput.placeholder = t.apiKeyPlaceholder;
    // ...

    const saveApiKeyLabelEl = document.querySelector(`label[for="${DOM.saveApiKeyCheckbox?.id}"]`);
    if (saveApiKeyLabelEl && t.saveApiKeyLabel) saveApiKeyLabelEl.textContent = t.saveApiKeyLabel;

    if (DOM.downloadBtn && t.downloadBtn) DOM.downloadBtn.textContent = t.downloadBtn;
    
    // For buttons with icons and text, target the text part if it's separate
    const copyBtnTextEl = DOM.copyTranslatedBtn?.querySelector('span:not([role="img"])');
    if (copyBtnTextEl && t.copyBtnText) {
        copyBtnTextEl.textContent = ` ${t.copyBtnText}`; // Add space if icon is first
    } else if (DOM.copyTranslatedBtn && t.copyBtnText) { // If button is text-only
        DOM.copyTranslatedBtn.textContent = t.copyBtnText;
    }


    const fileChooseLabelSpan = DOM.fileInputLabelEl?.querySelector('span:not([role="img"])');
    if (fileChooseLabelSpan && t.fileChooseLabel) {
        fileChooseLabelSpan.textContent = ` ${t.fileChooseLabel}`;
    } else if (DOM.fileInputLabelEl && t.fileChooseLabel && DOM.fileInputLabelEl.children.length > 0 && DOM.fileInputLabelEl.lastChild.nodeType === Node.TEXT_NODE) {
         DOM.fileInputLabelEl.lastChild.textContent = ` ${t.fileChooseLabel}`;
    }
    
    const currentFile = DOM.fileInput?.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
    }
  
    if (DOM.responseTitle && t.responseTitle) DOM.responseTitle.textContent = t.responseTitle;
    
    const translatingPlaceholderKey = 'translatingPlaceholder';
    // Update "Translating..." text only if it's currently showing that specific message
    const currentResponseText = DOM.responseBox?.textContent || "";
    const isCurrentlyTranslating = currentResponseText === (translations[currentLang]?.[translatingPlaceholderKey] || 'Translating... please wait.') || 
                                   currentResponseText === (translations[DEFAULT_UI_LANG]?.[translatingPlaceholderKey] || 'Translating... please wait.');
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
    if (t.tones && DOM.toneSelect) {
        const currentToneValue = DOM.toneSelect.value; // Get value before clearing
        DOM.toneSelect.innerHTML = ""; 
        let toneFoundInNewLang = false;
        t.tones.forEach(toneText => {
            const opt = document.createElement("option"); 
            opt.textContent = toneText; 
            opt.value = toneText; 
            if(toneText === currentToneValue) { 
                opt.selected = true; 
                toneFoundInNewLang = true; 
            }
            DOM.toneSelect.appendChild(opt);
        });
        // If previously selected tone not in new lang's list, or no previous selection, default to first
        if(!toneFoundInNewLang && t.tones.length > 0) { 
            DOM.toneSelect.value = t.tones[0]; 
        } else if (!toneFoundInNewLang && t.tones.length === 0) {
            // No tones defined for this language, maybe show a placeholder?
            const opt = document.createElement("option");
            opt.textContent = "---"; // Or a translated "No tones available"
            opt.disabled = true;
            DOM.toneSelect.appendChild(opt);
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
    updateLanguageSwitcherUI(); // Update active state of new lang buttons
}

export async function loadLanguage(lang) {
    if (!ALLOWED_UI_LANGS.includes(lang)) {
        console.warn(`Attempted to load unsupported language: ${lang}. Defaulting to ${currentLang}.`);
        lang = currentLang; 
    }
    const langFilePath = `src/lang/${lang}.json?v=ui_revamp_final_2`; 
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
            // showToast is defined in toastService.js, ensure it's available globally or imported
            if(typeof showToast === 'function') showToast(`Could not load translations for selected language. Reverting to default.`, 'error');
            else console.error(`Could not load translations for selected language. Reverting to default.`);

            if (translations[DEFAULT_UI_LANG]) { 
                currentLang = DEFAULT_UI_LANG; 
                applyActiveTranslations(); 
                updateLanguageSwitcherUI(); // Update UI to reflect default lang
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

// New Language Switcher UI Logic
function updateLanguageSwitcherUI() {
    const enButton = document.getElementById('langToggleEn');
    const faButton = document.getElementById('langToggleFa');
    if (enButton && faButton) {
        enButton.classList.toggle('active', currentLang === 'en');
        faButton.classList.toggle('active', currentLang === 'fa');
        // Update aria-pressed for accessibility
        enButton.setAttribute('aria-pressed', currentLang === 'en');
        faButton.setAttribute('aria-pressed', currentLang === 'fa');
    }
}

export function setupLanguageSwitcher() {
    const enButton = document.getElementById('langToggleEn');
    const faButton = document.getElementById('langToggleFa');

    const switchLang = (langCode) => {
        if (currentLang !== langCode) {
            localStorage.setItem(LS_LANG, langCode);
            loadLanguage(langCode); // This will call applyActiveTranslations and updateLanguageSwitcherUI
        }
    };

    if (enButton) enButton.addEventListener('click', () => switchLang('en'));
    if (faButton) faButton.addEventListener('click', () => switchLang('fa'));
    
    updateLanguageSwitcherUI(); // Set initial active state
}
