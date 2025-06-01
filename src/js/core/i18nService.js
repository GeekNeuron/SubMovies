// src/js/core/i18nService.js
import * as DOM from '../ui/domElements.js';
import { updateThemeServiceTranslations } from './themeService.js';

const translations = {};
let currentLang = 'en'; // Default, will be updated by initializeI18n
const allowedLangs = ['en', 'fa']; // As per current setup

const criticalFallbacks = { // English fallbacks for truly critical UI pieces
    appTitle: "Gemini Subtitle Translator",
    appTitleH1: "Gemini Subtitle Translator",
    apiKeyLabel: "Gemini API Key:",
    modelLabel: "AI Model:",
    translateBtn: "Translate Subtitles",
    // ... add more if absolutely necessary
};

function applyActiveTranslations() {
    const t = translations[currentLang] || translations['en'] || criticalFallbacks;

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';
    
    const formContainer = document.getElementById('formContainer');
    if (formContainer) formContainer.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    document.title = t.appTitle || criticalFallbacks.appTitle;
    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appTitleH1 || criticalFallbacks.appTitleH1;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else if (key === 'fileNone') {
            el.innerText = ''; // Ensure fileNone is empty if key missing
        } else if (translations['en']?.[key] !== undefined) {
            el.innerText = translations['en'][key]; // Fallback to English value if key exists there
            if (currentLang !== 'en') console.warn(`i18n: Missing key '${key}' for lang '${currentLang}', used English fallback.`);
        } else {
            // Keep existing HTML text or make it empty if truly no fallback
            // console.warn(`i18n: Critical - Missing key '${key}' for lang '${currentLang}' and no English fallback.`);
        }
    });
  
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) el.placeholder = t[key];
        else if (translations['en']?.[key] !== undefined) el.placeholder = translations['en'][key];
    });
  
    // Specific elements if not fully covered by data-i18n attributes for all properties
    if (DOM.apiKeyInput && t.apiKeyPlaceholder) DOM.apiKeyInput.placeholder = t.apiKeyPlaceholder;
    if (DOM.promptInput && t.promptPlaceholder) DOM.promptInput.placeholder = t.promptPlaceholder;
    if (DOM.filenameInput && t.filenamePlaceholder) DOM.filenameInput.placeholder = t.filenamePlaceholder;
    
    const saveApiKeyLabelEl = document.querySelector(`label[for="${DOM.saveApiKeyCheckbox?.id}"]`);
    if (saveApiKeyLabelEl && t.saveApiKeyLabel) saveApiKeyLabelEl.textContent = t.saveApiKeyLabel;

    if (DOM.downloadBtn && t.downloadBtn) DOM.downloadBtn.textContent = t.downloadBtn;
    
    const copyBtnTextEl = DOM.copyTranslatedBtn?.querySelector('span:not([role="img"])'); // Target text node if structure is icon + text
    if(DOM.copyTranslatedBtn && t.copyBtnText) { // Check if using a dedicated key for text part of button
         // Assuming the button structure is <button><span role="img">📋</span> <span data-i18n="copyBtnText">Copy</span></button>
         // Or if the button is just text:
         if (DOM.copyTranslatedBtn.childElementCount === 0 || !copyBtnTextEl) { // If button only has text
            DOM.copyTranslatedBtn.textContent = t.copyBtnText;
         } else if (copyBtnTextEl) { // If it has icon and text span
            copyBtnTextEl.textContent = t.copyBtnText;
         }
    } else if (DOM.copyTranslatedBtn && t.copyBtn) { // Fallback to copyBtn if copyBtnText is not defined
        // This logic needs to ensure it doesn't overwrite an icon if present
        // A safer way is to have a dedicated span for text inside the button
        // For now, assuming copyBtn is just text or the element has a specific structure
        // If icon is present, ensure data-i18n="copyBtn" is on the text part, not the button itself.
        // For simplicity, if the HTML for copy button has text directly, this will work:
        // DOM.copyTranslatedBtn.textContent = t.copyBtn; // This would overwrite icon if not careful
    }


    const fileChooseLabelSpan = DOM.fileInputLabelEl?.querySelector('span:not([role="img"])');
    if (fileChooseLabelSpan && t.fileChooseLabel) {
        fileChooseLabelSpan.textContent = t.fileChooseLabel;
    } else if (DOM.fileInputLabelEl && t.fileChooseLabel && DOM.fileInputLabelEl.childElementCount === 0) {
        DOM.fileInputLabelEl.textContent = t.fileChooseLabel; // if label is just text
    }
    
    const currentFile = DOM.fileInput?.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
    }
  
    if (DOM.responseTitle && t.responseTitle) DOM.responseTitle.textContent = t.responseTitle;
    
    const translatingPlaceholderKey = 'translatingPlaceholder';
    if (DOM.responseBox && DOM.responseBox.textContent && DOM.responseBox.textContent.includes("Translating")) { // A bit fragile check
        DOM.responseBox.textContent = t[translatingPlaceholderKey] !== undefined ? t[translatingPlaceholderKey] : '...';
    }
  
    const tempTooltipKey = 'temperatureTooltip';
    const tempTooltipEl = document.querySelector(`p[data-i18n="${tempTooltipKey}"]`); // Assuming p tag from HTML
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
    }

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
}

export async function loadLanguage(lang) {
    // Path corrected based on lang/ being in root, and src/js/ being where this script is.
    // fetch path is relative to the HTML document's location (root)
    const langFilePath = `lang/${lang}.json?v=final_struct_1`; 
    try {
        const response = await fetch(langFilePath);
        if (!response.ok) throw new Error(`HTTP error ${response.status} for ${langFilePath}`);
        translations[lang] = await response.json();
        currentLang = lang;
        applyActiveTranslations();
        localStorage.setItem('selectedLang', lang);
    } catch (error) {
        console.error(`Failed to load language ${lang} from ${langFilePath}:`, error);
        if (lang !== 'en') {
            // showToast is defined in toastService.js, ensure it's available or use console.error
            console.error(`Could not load translations for ${lang}. Trying English.`);
            if (translations['en']) {
                currentLang = 'en'; applyActiveTranslations(); if (DOM.langSelect) DOM.langSelect.value = 'en';
            } else { 
                await loadLanguage('en'); 
                if (translations['en'] && DOM.langSelect) DOM.langSelect.value = 'en';
            }
        } else if (!translations['en']) {
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Critical error: Core English language files could not be loaded.</p>";
        }
    }
}

export async function initializeI18n() {
    const savedLang = localStorage.getItem('selectedLang') || navigator.language.split('-')[0] || 'en';
    let langToLoad = allowedLangs.includes(savedLang) ? savedLang : 'en'; 

    if (DOM.langSelect) {
        Array.from(DOM.langSelect.options).forEach(option => {
            if (!allowedLangs.includes(option.value)) { option.remove(); }
        });
        DOM.langSelect.value = langToLoad; 
        DOM.langSelect.addEventListener('change', (e) => loadLanguage(e.target.value));
    }
    await loadLanguage(langToLoad);
}

export function getCurrentTranslations() {
    return translations[currentLang] || translations['en'] || criticalFallbacks;
}

export function applyCurrentTranslations() { // Exposed for other modules if needed
    applyActiveTranslations();
}
