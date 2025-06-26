// src/js/ui/settingsController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { openModal } from './modalController.js';
import {
    LS_API_KEY, LS_SAVE_API_KEY_PREF, LS_TEMPERATURE,
    LS_LAST_MODEL, LS_LAST_TONE, LS_LAST_TARGET_LANG,
    DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_TONE, DEFAULT_TARGET_LANG
} from '../utils/constants.js';

let settingsCache = {}; // Cache for current settings to avoid frequent DOM reads

/**
 * Initializes all settings-related UI elements and event listeners.
 */
export function initializeSettings() {
    // Load and apply all saved settings from localStorage
    loadAndApplyAllSettings();
    
    // Attach event listeners
    attachEventListeners();
}

/**
 * Loads all settings from localStorage and updates the UI accordingly.
 */
function loadAndApplyAllSettings() {
    const t = getCurrentTranslations();

    // API Key
    const savePref = localStorage.getItem(LS_SAVE_API_KEY_PREF) === 'true';
    DOM.saveApiKeyCheckbox.checked = savePref;
    if (savePref) {
        DOM.apiKeyInput.value = localStorage.getItem(LS_API_KEY) || '';
    }

    // Temperature
    const savedTemp = localStorage.getItem(LS_TEMPERATURE) || DEFAULT_TEMPERATURE.toString();
    DOM.temperatureInput.value = savedTemp;
    DOM.temperatureValueDisplay.textContent = savedTemp;
    
    // Model Selection
    const savedModel = localStorage.getItem(LS_LAST_MODEL) || DEFAULT_MODEL;
    const modelText = t.models[savedModel] || savedModel;
    DOM.modelSelectBtn.textContent = modelText;
    settingsCache.model = savedModel;
    
    // Tone Selection
    const savedTone = localStorage.getItem(LS_LAST_TONE) || t.tones[1] || DEFAULT_TONE;
    DOM.toneSelectBtn.textContent = savedTone;
    settingsCache.tone = savedTone;

    // Target Language Selection
    const savedLang = localStorage.getItem(LS_LAST_TARGET_LANG) || DEFAULT_TARGET_LANG;
    const langOption = Array.from(document.querySelectorAll('#langTargetSelect option')).find(opt => opt.value === savedLang);
    DOM.langTargetSelectBtn.textContent = langOption ? langOption.textContent : savedLang;
    settingsCache.targetLang = savedLang;
}

/**
 * Attaches event listeners for all settings controls.
 */
function attachEventListeners() {
    // API Key Listeners
    DOM.saveApiKeyCheckbox.addEventListener('change', handleSaveApiKeyChange);
    DOM.apiKeyInput.addEventListener('input', handleApiKeyInput);

    // Temperature Slider
    DOM.temperatureInput.addEventListener('input', handleTemperatureChange);

    // Modal Trigger Listeners
    DOM.modelSelectBtn.addEventListener('click', handleModelSelect);
    DOM.toneSelectBtn.addEventListener('click', handleToneSelect);
    DOM.langTargetSelectBtn.addEventListener('click', handleLangTargetSelect);
}

// --- Event Handlers ---

function handleSaveApiKeyChange() {
    if (DOM.saveApiKeyCheckbox.checked) {
        localStorage.setItem(LS_API_KEY, DOM.apiKeyInput.value);
        localStorage.setItem(LS_SAVE_API_KEY_PREF, 'true');
    } else {
        localStorage.removeItem(LS_API_KEY);
        localStorage.setItem(LS_SAVE_API_KEY_PREF, 'false');
    }
}

function handleApiKeyInput() {
    if (DOM.saveApiKeyCheckbox.checked) {
        localStorage.setItem(LS_API_KEY, DOM.apiKeyInput.value);
    }
}

function handleTemperatureChange(event) {
    DOM.temperatureValueDisplay.textContent = event.target.value;
    localStorage.setItem(LS_TEMPERATURE, event.target.value);
}

function handleModelSelect() {
    const t = getCurrentTranslations();
    const options = Object.entries(t.models).map(([value, text]) => ({ value, text }));
    
    openModal(t.modelLabel, options, settingsCache.model, (selectedValue) => {
        DOM.modelSelectBtn.textContent = t.models[selectedValue] || selectedValue;
        localStorage.setItem(LS_LAST_MODEL, selectedValue);
        settingsCache.model = selectedValue;
    });
}

function handleToneSelect() {
    const t = getCurrentTranslations();
    const options = (t.tones || []).map(tone => ({ value: tone, text: tone }));
    
    openModal(t.toneLabel, options, settingsCache.tone, (selectedValue) => {
        DOM.toneSelectBtn.textContent = selectedValue;
        localStorage.setItem(LS_LAST_TONE, selectedValue);
        settingsCache.tone = selectedValue;
    });
}

function handleLangTargetSelect() {
    const t = getCurrentTranslations();
    const langOptions = Array.from(document.querySelectorAll('#langTargetSelect option')).map(opt => ({ value: opt.value, text: opt.textContent }));

    openModal(t.langTargetLabel, langOptions, settingsCache.targetLang, (selectedValue) => {
        const selectedOption = langOptions.find(opt => opt.value === selectedValue);
        DOM.langTargetSelectBtn.textContent = selectedOption ? selectedOption.text : selectedValue;
        localStorage.setItem(LS_LAST_TARGET_LANG, selectedValue);
        settingsCache.targetLang = selectedValue;
    });
}


/**
 * Gathers all current settings from the UI and cache.
 * @returns {object} An object containing all relevant settings values.
 */
export function getSettings() {
    return {
        apiKey: DOM.apiKeyInput.value.trim(),
        model: settingsCache.model,
        temperature: parseFloat(DOM.temperatureInput.value),
        tone: settingsCache.tone,
        targetLang: settingsCache.targetLang,
        inputText: DOM.promptInput.value.trim(),
        originalInputText: DOM.promptInput.value,
        outputFilename: DOM.filenameInput.value.trim(),
    };
}
