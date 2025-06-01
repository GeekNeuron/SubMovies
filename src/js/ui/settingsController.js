// src/js/ui/settingsController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations, applyCurrentTranslations } from '../core/i18nService.js'; // For updating labels on load
import { 
    LS_API_KEY, LS_SAVE_API_KEY_PREF, LS_TEMPERATURE, 
    LS_LAST_MODEL, LS_LAST_TONE, LS_LAST_TARGET_LANG,
    DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_TONE, DEFAULT_TARGET_LANG
} from '../utils/constants.js';

/**
 * Initializes all settings-related UI elements and event listeners.
 * Loads saved settings from localStorage.
 */
export function initializeSettings() {
    // API Key Saving
    if (DOM.saveApiKeyCheckbox && DOM.apiKeyInput) {
        DOM.saveApiKeyCheckbox.addEventListener('change', handleSaveApiKeyChange);
        if (localStorage.getItem(LS_SAVE_API_KEY_PREF) === 'true') {
            DOM.apiKeyInput.value = localStorage.getItem(LS_API_KEY) || '';
            DOM.saveApiKeyCheckbox.checked = true;
        }
        DOM.apiKeyInput.addEventListener('input', handleApiKeyInput);
    }

    // Temperature Slider
    if (DOM.temperatureInput && DOM.temperatureValueDisplay) {
        const savedTemp = localStorage.getItem(LS_TEMPERATURE);
        DOM.temperatureInput.value = savedTemp !== null ? savedTemp : DEFAULT_TEMPERATURE.toString();
        DOM.temperatureValueDisplay.textContent = DOM.temperatureInput.value;
        DOM.temperatureInput.addEventListener('input', handleTemperatureChange);
    }

    // Persist other settings (Model, Tone, Target Language)
    if (DOM.modelSelect) {
        const savedModel = localStorage.getItem(LS_LAST_MODEL);
        if (savedModel) DOM.modelSelect.value = savedModel;
        DOM.modelSelect.addEventListener('change', (e) => localStorage.setItem(LS_LAST_MODEL, e.target.value));
    }
    if (DOM.toneSelect) {
        // Tone options are populated by i18nService, so we load saved value after that.
        // For now, just set up the save listener. applyTranslations will handle initial value.
        DOM.toneSelect.addEventListener('change', (e) => localStorage.setItem(LS_LAST_TONE, e.target.value));
    }
    if (DOM.langTargetSelect) {
        const savedTargetLang = localStorage.getItem(LS_LAST_TARGET_LANG);
        if (savedTargetLang) DOM.langTargetSelect.value = savedTargetLang;
        DOM.langTargetSelect.addEventListener('change', (e) => localStorage.setItem(LS_LAST_TARGET_LANG, e.target.value));
    }
    
    // Apply translations to any settings labels that might not have been covered initially
    // This is important if settings are initialized before full i18n load.
    // However, main.js orchestrates this: i18n init -> then settings init.
    // applyCurrentTranslations(); // Re-apply to ensure all labels are correct
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
    if (DOM.saveApiKeyCheckbox && DOM.saveApiKeyCheckbox.checked) {
        localStorage.setItem(LS_API_KEY, DOM.apiKeyInput.value);
    }
}

function handleTemperatureChange(event) {
    if (DOM.temperatureValueDisplay) DOM.temperatureValueDisplay.textContent = event.target.value;
    localStorage.setItem(LS_TEMPERATURE, event.target.value);
}

/**
 * Gathers all current settings from the UI elements.
 * @returns {object} An object containing all relevant settings values.
 */
export function getSettings() {
    const apiKey = DOM.apiKeyInput ? DOM.apiKeyInput.value.trim() : '';
    const model = DOM.modelSelect ? DOM.modelSelect.value : DEFAULT_MODEL;
    const temperature = DOM.temperatureInput ? parseFloat(DOM.temperatureInput.value) : DEFAULT_TEMPERATURE;
    const tone = DOM.toneSelect ? (DOM.toneSelect.value || DEFAULT_TONE) : DEFAULT_TONE;
    const targetLang = DOM.langTargetSelect ? (DOM.langTargetSelect.value || DEFAULT_TARGET_LANG) : DEFAULT_TARGET_LANG;
    const inputText = DOM.promptInput ? DOM.promptInput.value.trim() : ''; // Trimmed for processing
    const originalInputText = DOM.promptInput ? DOM.promptInput.value : ''; // Raw for comparison display
    const outputFilename = DOM.filenameInput ? DOM.filenameInput.value.trim() : '';

    return {
        apiKey,
        model,
        temperature,
        tone,
        targetLang,
        inputText,
        originalInputText, 
        outputFilename
    };
}

// Called by i18nService after language load to potentially set saved tone
export function applySavedTonePreference() {
    if (DOM.toneSelect) {
        const savedTone = localStorage.getItem(LS_LAST_TONE);
        if (savedTone) {
            // Check if savedTone is a valid option in the currently populated select
            const optionExists = Array.from(DOM.toneSelect.options).some(opt => opt.value === savedTone);
            if (optionExists) {
                DOM.toneSelect.value = savedTone;
            } else if (DOM.toneSelect.options.length > 0) {
                DOM.toneSelect.value = DOM.toneSelect.options[0].value; // Default to first if saved not valid
            }
        } else if (DOM.toneSelect.options.length > 0) {
             DOM.toneSelect.value = DOM.toneSelect.options[0].value; // Default to first if no saved value
        }
    }
}
