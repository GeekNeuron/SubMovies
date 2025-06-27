// src/js/ui/settingsController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { openModal } from './modalController.js';
import {
    LS_API_KEY, LS_SAVE_API_KEY_PREF, LS_TEMPERATURE,
    LS_LAST_MODEL, LS_LAST_TONE_INDEX,
    DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_TONE
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
    if(DOM.saveApiKeyCheckbox) DOM.saveApiKeyCheckbox.checked = savePref;
    if (savePref && DOM.apiKeyInput) {
        DOM.apiKeyInput.value = localStorage.getItem(LS_API_KEY) || '';
    }

    // Temperature
    const savedTemp = localStorage.getItem(LS_TEMPERATURE) || DEFAULT_TEMPERATURE.toString();
    if(DOM.temperatureInput) DOM.temperatureInput.value = savedTemp;
    if(DOM.temperatureValueDisplay) DOM.temperatureValueDisplay.textContent = savedTemp;

    // Model Selection
    const savedModel = localStorage.getItem(LS_LAST_MODEL) || DEFAULT_MODEL;
    if (t.models && DOM.modelSelectBtn) {
        const modelText = t.models[savedModel] || savedModel;
        DOM.modelSelectBtn.textContent = modelText;
    }
    settingsCache.model = savedModel;

    // Load tone by index for robust language switching
    const savedToneIndex = parseInt(localStorage.getItem(LS_LAST_TONE_INDEX), 10);
    const tones = t.tones || [];
    let selectedTone;
    if (!isNaN(savedToneIndex) && savedToneIndex >= 0 && savedToneIndex < tones.length) {
        selectedTone = tones[savedToneIndex];
    } else {
        selectedTone = tones.length > 1 ? tones[1] : (tones[0] || DEFAULT_TONE);
    }
    if(DOM.toneSelectBtn) DOM.toneSelectBtn.textContent = selectedTone;
    settingsCache.tone = selectedTone;
}

/**
 * Attaches event listeners for all settings controls.
 */
function attachEventListeners() {
    if(DOM.saveApiKeyCheckbox) DOM.saveApiKeyCheckbox.addEventListener('change', handleSaveApiKeyChange);
    if(DOM.apiKeyInput) DOM.apiKeyInput.addEventListener('input', handleApiKeyInput);
    if(DOM.temperatureInput) DOM.temperatureInput.addEventListener('input', handleTemperatureChange);
    if(DOM.modelSelectBtn) DOM.modelSelectBtn.addEventListener('click', handleModelSelect);
    if(DOM.toneSelectBtn) DOM.toneSelectBtn.addEventListener('click', handleToneSelect);
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
    if(DOM.temperatureValueDisplay) DOM.temperatureValueDisplay.textContent = event.target.value;
    localStorage.setItem(LS_TEMPERATURE, event.target.value);
}

function handleModelSelect() {
    const t = getCurrentTranslations();
    const options = Object.entries(t.models || {}).map(([value, text]) => ({ value, text }));
    
    openModal(t.modelLabel, options, settingsCache.model, (selectedValue) => {
        DOM.modelSelectBtn.textContent = (t.models || {})[selectedValue] || selectedValue;
        localStorage.setItem(LS_LAST_MODEL, selectedValue);
        settingsCache.model = selectedValue;
    });
}

function handleToneSelect() {
    const t = getCurrentTranslations();
    const tones = t.tones || [];
    const options = tones.map(tone => ({ value: tone, text: tone }));
    
    openModal(t.toneLabel, options, settingsCache.tone, (selectedValue) => {
        DOM.toneSelectBtn.textContent = selectedValue;
        settingsCache.tone = selectedValue;

        const selectedIndex = tones.indexOf(selectedValue);
        if (selectedIndex !== -1) {
            localStorage.setItem(LS_LAST_TONE_INDEX, selectedIndex);
        }
    });
}

/**
 * Gathers all current settings from the UI and cache.
 * @returns {object} An object containing all relevant settings values.
 */
export function getSettings() {
    return {
        apiKey: DOM.apiKeyInput ? DOM.apiKeyInput.value.trim() : '',
        model: settingsCache.model,
        temperature: DOM.temperatureInput ? parseFloat(DOM.temperatureInput.value) : DEFAULT_TEMPERATURE,
        tone: settingsCache.tone,
        inputText: DOM.promptInput ? DOM.promptInput.value.trim() : '',
        originalInputText: DOM.promptInput ? DOM.promptInput.value : '',
    };
}
