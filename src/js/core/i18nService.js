// src/js/core/i18nService.js
import * as DOM from '../ui/domElements.js'; // Assuming domElements.js is in the same ui folder or adjust path
import { updateThemeServiceTranslations } from './themeService.js'; // To update theme button ARIA label

const translations = {};
let currentLang = 'en'; // Default language, will be updated by initializeI18n
const allowedLangs = ['en', 'fa']; // Defined here or imported from constants.js

// Fallback English texts for critical UI elements if JSON loading fails catastrophically
const criticalFallbacks = {
    appTitle: "Gemini Subtitle Translator",
    appTitleH1: "Gemini Subtitle Translator",
    apiKeyLabel: "Gemini API Key:",
    apiKeyPlaceholder: "Paste your Gemini API Key here",
    modelLabel: "AI Model:",
    translateBtn: "Translate Subtitles",
    // Add more critical fallbacks as needed based on your UI
};

function applyActiveTranslations() {
    const t = translations[currentLang] || translations['en'] || criticalFallbacks; // Ensure 't' is always an object

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';
    
    const formContainer = document.getElementById('formContainer'); // Can also be from DOM module
    if (formContainer) formContainer.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    document.title = t.appTitle || criticalFallbacks.appTitle;
    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appTitleH1 || criticalFallbacks.appTitleH1;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else if (key === 'fileNone') {
            el.innerText = ''; 
        } else if (translations['en']?.[key] !== undefined) {
            el.innerText = translations['en'][key]; 
            if (currentLang !== 'en') console.warn(`i18n: Missing key '${key}' for lang '${currentLang}', used English fallback.`);
        } else {
            // Fallback to existing HTML text content if key is missing everywhere
            // console.warn(`i18n: Critical - Missing key '${key}' for lang '${currentLang}' and no English fallback.`);
        }
    });
  
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) el.placeholder = t[key];
        else if (translations['en']?.[key] !== undefined) el.placeholder = translations['en'][key];
    });
  
    if (DOM.apiKeyInput && t.apiKeyPlaceholder) DOM.apiKeyInput.placeholder = t.apiKeyPlaceholder;
    if (DOM.promptInput && t.promptPlaceholder) DOM.promptInput.placeholder = t.promptPlaceholder;
    if (DOM.filenameInput && t.filenamePlaceholder) DOM.filenameInput.placeholder = t.filenamePlaceholder;
    
    const saveApiKeyLabelEl = document.querySelector(`label[for="${DOM.saveApiKeyCheckbox?.id}"]`);
    if (saveApiKeyLabelEl && t.saveApiKeyLabel) saveApiKeyLabelEl.textContent = t.saveApiKeyLabel;

    if (DOM.downloadBtn && t.downloadBtn) DOM.downloadBtn.textContent = t.downloadBtn;
    
    // Assuming button structure: <button> <span_icon/> <span_text_to_translate/> </button>
    // Or that data-i18n is on the text span directly.
    // The copy button needs to be handled carefully if it contains an icon.
    const copyBtnTextSpan = DOM.copyTranslatedBtn?.querySelector('span:not([role="img"])'); // If text is in a span
    if (copyBtnTextSpan && t.copyBtnText) { // Assuming a key like "copyBtnText" for the text part
        copyBtnTextSpan.textContent = t.copyBtnText;
    } else if (DOM.copyTranslatedBtn && t.copyBtn && DOM.copyTranslatedBtn.childElementCount === 0){ // If button is just text
        DOM.copyTranslatedBtn.textContent = t.copyBtn;
    }


    const fileChooseLabelSpan = DOM.fileInputLabelEl?.querySelector('span:not([role="img"])');
    if (fileChooseLabelSpan && t.fileChooseLabel) {
        fileChooseLabelSpan.textContent = t.fileChooseLabel;
    } else if (DOM.fileInputLabelEl && t.fileChooseLabel && DOM.fileInputLabelEl.childElementCount === 1) { // Assuming only one child (the text span) besides icon
         // This logic needs to be robust based on actual HTML of fileInputLabelEl
    }
    
    const currentFile = DOM.fileInput?.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
    }
  
    if (DOM.responseTitle && t.responseTitle) DOM.responseTitle.textContent = t.responseTitle;
    
    const translatingPlaceholderKey = 'translatingPlaceholder';
    if (DOM.responseBox && DOM.responseBox.textContent && DOM.responseBox.textContent.includes("Translating")) {
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
    }

    if (t.models && DOM.modelSelect) {
        Array.from(DOM.modelSelect.options).forEach(opt => {
            const modelKey = opt.value; 
            if (t.models[modelKey]) { opt.textContent = t.models[modelKey]; }
        });
    }
    
    updateThemeServiceTranslations(t); 
    if (typeof window.updateCharCountGlobal === 'function') {
        window.updateCharCountGlobal(); // Call the globally exposed char count updater
    }
}

export async function loadLanguage(lang) {
    // Path updated to src/lang/ assuming index.html is in root.
    // fetch paths are relative to the document that loaded the script.
    const langFilePath = `src/lang/${lang}.json?v=src_path_fix_1`; 
    try {
        const response = await fetch(langFilePath);
        if (!response.ok) throw new Error(`HTTP error ${response.status} for ${langFilePath}`);
        translations[lang] = await response.json();
        currentLang = lang;
        applyActiveTranslations();
        localStorage.setItem('selectedLang', lang); // Use a consistent key from constants.js preferably
    } catch (error) {
        console.error(`Failed to load language ${lang} from ${langFilePath}:`, error);
        if (lang !== 'en') {
            console.error(`Could not load translations for ${lang}. Trying English.`); // Use console for service error
            if (translations['en']) { // If English is already loaded, use it
                currentLang = 'en'; 
                applyActiveTranslations(); 
                if (DOM.langSelect) DOM.langSelect.value = 'en';
            } else { // If English also not loaded, attempt to load it
                await loadLanguage('en'); // This might recursively call if 'en' also fails
                if (translations['en'] && DOM.langSelect) DOM.langSelect.value = 'en';
            }
        } else if (!translations['en']) { // Critical: English itself failed
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Critical error: Core English language files could not be loaded. Application cannot start.</p>";
        }
    }
}

export async function initializeI18n() {
    // Use constants for default lang and allowed langs
    const defaultLang = 'en'; // Or import from constants.js
    const savedLang = localStorage.getItem('selectedLang') || navigator.language.split('-')[0] || defaultLang;
    let langToLoad = allowedLangs.includes(savedLang) ? savedLang : defaultLang; 

    if (DOM.langSelect) {
        // Ensure only allowed languages are in the dropdown if it was pre-filled by HTML
        Array.from(DOM.langSelect.options).forEach(option => {
            if (!allowedLangs.includes(option.value)) { 
                option.remove(); 
            }
        });
        DOM.langSelect.value = langToLoad; 
        DOM.langSelect.addEventListener('change', (e) => loadLanguage(e.target.value));
    }
    await loadLanguage(langToLoad); // Load and apply the initial language
}

export function getCurrentTranslations() {
    // Provide a more robust fallback chain
    return translations[currentLang] || translations['en'] || criticalFallbacks;
}

export function applyCurrentTranslations() { // Exposed for other modules if needed
    applyActiveTranslations();
}
