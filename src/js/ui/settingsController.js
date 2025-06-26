// src/js/ui/settingsController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { openModal } from './modalController.js';

// ✅ BUG FIX: All required constants are now imported from the constants file.
// The previous version was missing DEFAULT_MODEL, DEFAULT_TONE, DEFAULT_TARGET_LANG, etc.
import {
    LS_API_KEY, LS_SAVE_API_KEY_PREF, LS_TEMPERATURE,
    LS_LAST_MODEL, LS_LAST_TONE_INDEX, LS_LAST_TARGET_LANG,
    DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_TONE, DEFAULT_TARGET_LANG
} from '../utils/constants.js';

let settingsCache = {};

/**
 * Initializes all settings-related UI elements and event listeners.
 */
export function initializeSettings() {
    loadAndApplyAllSettings();
    attachEventListeners();
}

/**
 * Loads all settings from localStorage and updates the UI accordingly.
 * This function is exported to be callable after language changes.
 */
export function loadAndApplyAllSettings() {
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

    // Load tone by index for robust language switching
    const savedToneIndex = parseInt(localStorage.getItem(LS_LAST_TONE_INDEX), 10);
    const tones = t.tones || [];
    let selectedTone;
    // Check if the saved index is valid for the current language's tone array
    if (!isNaN(savedToneIndex) && savedToneIndex >= 0 && savedToneIndex < tones.length) {
        selectedTone = tones[savedToneIndex];
    } else {
        // Default to the second tone ('Neutral') if available, otherwise the first, or a hardcoded fallback.
        selectedTone = tones.length > 1 ? tones[1] : (tones[0] || DEFAULT_TONE);
    }
    DOM.toneSelectBtn.textContent = selectedTone;
    settingsCache.tone = selectedTone;

    // Target Language Selection
    // This line will no longer crash because DEFAULT_TARGET_LANG is now imported.
    const savedLang = localStorage.getItem(LS_LAST_TARGET_LANG) || DEFAULT_TARGET_LANG;
    const hiddenSelect = document.getElementById('langTargetSelect');
    const langOption = Array.from(hiddenSelect.options).find(opt => opt.value === savedLang);
    DOM.langTargetSelectBtn.textContent = langOption ? langOption.textContent : savedLang;
    settingsCache.targetLang = savedLang;
}

/**
 * Attaches event listeners for all settings controls.
 */
function attachEventListeners() {
    DOM.saveApiKeyCheckbox.addEventListener('change', handleSaveApiKeyChange);
    DOM.apiKeyInput.addEventListener('input', handleApiKeyInput);
    DOM.temperatureInput.addEventListener('input', handleTemperatureChange);
    DOM.modelSelectBtn.addEventListener('click', handleModelSelect);
    DOM.toneSelectBtn.addEventListener('click', handleToneSelect);
    DOM.langTargetSelectBtn.addEventListener('click', handleLangTargetSelect);
}


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
        settingsCache.tone = selectedValue;

        // Save the index, not the text value
        const selectedIndex = (t.tones || []).indexOf(selectedValue);
        if (selectedIndex !== -1) {
            localStorage.setItem(LS_LAST_TONE_INDEX, selectedIndex);
        }
    });
}

function handleLangTargetSelect() {
    const t = getCurrentTranslations();
    const hiddenSelect = document.getElementById('langTargetSelect');
    const langOptions = Array.from(hiddenSelect.options).map(opt => ({ value: opt.value, text: opt.textContent }));

    openModal(t.langTargetLabel, langOptions, settingsCache.targetLang, (selectedValue) => {
        const selectedOption = langOptions.find(opt => opt.value === selectedValue);
        DOM.langTargetSelectBtn.textContent = selectedOption ? selectedOption.text : selectedValue;
        localStorage.setItem(LS_LAST_TARGET_LANG, selectedValue);
        settingsCache.targetLang = selectedValue;
    });
}

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
