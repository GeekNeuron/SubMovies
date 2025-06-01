// src/js/core/i18nService.js
import * as DOM from '../ui/domElements.js';
import { updateThemeServiceTranslations } from './themeService.js'; // To update theme button ARIA label

const translations = {};
let currentLang = 'en'; // Default language
const allowedLangs = ['en', 'fa']; // Defined in main.js or here

// Fallback English texts for critical UI elements if JSON loading fails catastrophically
const criticalFallbacks = {
    appTitle: "Gemini Subtitle Translator",
    appTitleH1: "Gemini Subtitle Translator",
    apiKeyLabel: "Gemini API Key:",
    apiKeyPlaceholder: "Paste your Gemini API Key here",
    modelLabel: "AI Model:",
    translateBtn: "Translate Subtitles",
    // Add more critical fallbacks as needed
};

function applyActiveTranslations() {
    const t = translations[currentLang] || translations['en'] || criticalFallbacks; // Ensure 't' is always an object

    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';
    
    const formContainer = document.getElementById('formContainer'); // Direct get, as it's layout-related
    if (formContainer) formContainer.dir = (currentLang === 'fa') ? 'rtl' : 'ltr';

    document.title = t.appTitle || criticalFallbacks.appTitle;
    if (DOM.appTitleH1) DOM.appTitleH1.textContent = t.appTitleH1 || criticalFallbacks.appTitleH1;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            el.innerText = t[key];
        } else if (key === 'fileNone') {
            el.innerText = ''; // Specifically handle fileNone to be empty if key missing
        } else {
            // For other keys, if missing in current lang, try English, then fallback to existing HTML or empty
            const fallbackText = translations['en']?.[key] || (el.id === 'fileNameText' && key === 'fileNone' ? '' : el.innerText);
            el.innerText = fallbackText;
            if (t[key] === undefined && lang !== 'en') console.warn(`i18n: Missing key '${key}' for lang '${currentLang}', used fallback.`);
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) el.placeholder = t[key];
        else el.placeholder = translations['en']?.[key] || el.placeholder; // Fallback to English placeholder
    });

    // Specific elements that might not use data-i18n for all properties
    if (DOM.apiKeyInput && t.apiKeyPlaceholder) DOM.apiKeyInput.placeholder = t.apiKeyPlaceholder;
    if (DOM.promptInput && t.promptPlaceholder) DOM.promptInput.placeholder = t.promptPlaceholder;
    if (DOM.filenameInput && t.filenamePlaceholder) DOM.filenameInput.placeholder = t.filenamePlaceholder;
    
    const saveApiKeyLabelEl = document.querySelector(`label[for="${DOM.saveApiKeyCheckbox.id}"]`);
    if (saveApiKeyLabelEl && t.saveApiKeyLabel) saveApiKeyLabelEl.textContent = t.saveApiKeyLabel;


    if (DOM.downloadBtn && t.downloadBtn) DOM.downloadBtn.textContent = t.downloadBtn;
    
    const copyBtnTextEl = DOM.copyTranslatedBtn?.childNodes[1]; // Assuming icon then text node
    if (copyBtnTextEl && t.copyBtn) copyBtnTextEl.nodeValue = ` ${t.copyBtn}`;
    
    const fileChooseLabelTextEl = DOM.fileInputLabelEl?.childNodes[1]; // Assuming icon then text node
    if (fileChooseLabelTextEl && t.fileChooseLabel) fileChooseLabelTextEl.nodeValue = ` ${t.fileChooseLabel}`;


    const currentFile = DOM.fileInput.files[0];
    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
    }

    if (DOM.responseTitle && t.responseTitle) DOM.responseTitle.textContent = t.responseTitle;
    
    const translatingPlaceholderKey = 'translatingPlaceholder';
    if (DOM.responseBox && DOM.responseBox.textContent === ( (translations[currentLang] || {})[translatingPlaceholderKey] || 'Translating... please wait.')) {
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
        DOM.toneSelect.innerHTML = ""; // Clear previous options
        let toneFound = false;
        t.tones.forEach(toneText => {
            const opt = document.createElement("option");
            opt.textContent = toneText;
            opt.value = toneText;
            if (toneText === currentToneValue) {
                opt.selected = true;
                toneFound = true;
            }
            DOM.toneSelect.appendChild(opt);
        });
        if (!toneFound && t.tones.length > 0) { // Default to first if previous not found
            DOM.toneSelect.value = t.tones[0];
        }
    }

    if (t.models && DOM.modelSelect) {
        Array.from(DOM.modelSelect.options).forEach(opt => {
            const modelKey = opt.value;
            if (t.models[modelKey]) {
                opt.textContent = t.models[modelKey];
            }
            // Else, keep the default text from HTML if model key not in lang file (less ideal)
        });
    }
    
    // Notify other services that translations have been updated
    updateThemeServiceTranslations(t); // For theme toggle button ARIA label
    // Call other update functions if needed, e.g., for char count label
    if (typeof window.updateCharCount === 'function') { // Check if global char count updater exists
        window.updateCharCount(); // This is a bit of a hack, better to import/pass explicitly
    }
}

export async function loadLanguage(lang) {
    if (!allowedLangs.includes(lang)) {
        console.warn(`Language ${lang} is not allowed. Defaulting to ${currentLang}.`);
        lang = currentLang; // Keep current or default to 'en'
    }
    try {
        const response = await fetch(`src/lang/${lang}.json?v=struct_rev_final`);
        if (!response.ok) throw new Error(`HTTP error ${response.status} while fetching ${lang}.json`);
        translations[lang] = await response.json();
        currentLang = lang;
        applyActiveTranslations();
        localStorage.setItem('selectedLang', lang);
    } catch (error) {
        console.error(`Failed to load language ${lang}:`, error);
        if (lang !== 'en') { // If the failed language was not English
            if (translations['en']) { // If English is already loaded, use it
                currentLang = 'en';
                applyActiveTranslations();
                if (DOM.langSelect) DOM.langSelect.value = 'en';
            } else { // If English also not loaded, attempt to load it
                await loadLanguage('en'); // This might recursively call if 'en' also fails
                if (translations['en'] && DOM.langSelect) DOM.langSelect.value = 'en';
            }
        } else if (!translations['en']) { // Critical: English itself failed
            document.body.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Critical error: Core language files (English) could not be loaded. The application cannot start. Please check your network connection or contact support.</p>";
        }
    }
}

export async function initializeI18n() {
    const savedLang = localStorage.getItem('selectedLang') || navigator.language.split('-')[0] || 'en';
    let langToLoad = allowedLangs.includes(savedLang) ? savedLang : 'en'; // Default to English if saved/detected not allowed

    if (DOM.langSelect) {
        // Ensure only allowed languages are in the dropdown if it was pre-filled by HTML
        Array.from(DOM.langSelect.options).forEach(option => {
            if (!allowedLangs.includes(option.value)) {
                option.remove();
            }
        });
        DOM.langSelect.value = langToLoad; // Set dropdown value
        DOM.langSelect.addEventListener('change', (e) => loadLanguage(e.target.value));
    }
    await loadLanguage(langToLoad); // Load and apply the initial language
}

export function getCurrentTranslations() {
    return translations[currentLang] || translations['en'] || criticalFallbacks; // Robust fallback
}

// Expose a function to re-apply translations if needed by other modules, e.g., after dynamic content load
export function applyCurrentTranslations() {
    applyActiveTranslations();
}
