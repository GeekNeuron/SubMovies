// src/js/ui/settingsController.js
import * as DOM from './domElements.js';

let currentTranslationsGetter; // Function to get current translations

/**
 * Initializes settings-related event listeners and loads saved settings.
 * @param {function} getTranslationsFunc - Function to get current translations object.
 */
export function initializeSettings(getTranslationsFunc) {
    currentTranslationsGetter = getTranslationsFunc;

    // API Key Saving
    if (DOM.saveApiKeyCheckbox) {
        DOM.saveApiKeyCheckbox.addEventListener('change', handleSaveApiKeyChange);
        // Load saved preference
        if (localStorage.getItem('saveApiKeySetting') === 'true') {
            DOM.apiKeyInput.value = localStorage.getItem('apiKeyVal') || '';
            DOM.saveApiKeyCheckbox.checked = true;
        }
    }
    if (DOM.apiKeyInput) {
        DOM.apiKeyInput.addEventListener('input', handleApiKeyInput);
    }

    // Temperature Slider
    if (DOM.temperatureInput && DOM.temperatureValueDisplay) {
        // Load saved temperature or set default
        const savedTemp = localStorage.getItem('temperatureSetting');
        DOM.temperatureInput.value = savedTemp !== null ? savedTemp : '0.7';
        DOM.temperatureValueDisplay.textContent = DOM.temperatureInput.value;

        DOM.temperatureInput.addEventListener('input', handleTemperatureChange);
    }
    // Other settings like model, tone, targetLang are typically handled by their respective change listeners
    // if their values need to be persisted or have specific UI updates beyond i18n.
}

function handleSaveApiKeyChange() {
    if (DOM.saveApiKeyCheckbox.checked) {
        localStorage.setItem('apiKeyVal', DOM.apiKeyInput.value);
        localStorage.setItem('saveApiKeySetting', 'true');
    } else {
        localStorage.removeItem('apiKeyVal');
        localStorage.setItem('saveApiKeySetting', 'false');
    }
}

function handleApiKeyInput() {
    if (DOM.saveApiKeyCheckbox && DOM.saveApiKeyCheckbox.checked) {
        localStorage.setItem('apiKeyVal', DOM.apiKeyInput.value);
    }
}

function handleTemperatureChange(event) {
    DOM.temperatureValueDisplay.textContent = event.target.value;
    localStorage.setItem('temperatureSetting', event.target.value);
}

/**
 * Gathers all current settings from the UI.
 * @returns {object} An object containing all relevant settings.
 */
export function getSettings() {
    // Ensure DOM elements exist before trying to access their properties
    const apiKey = DOM.apiKeyInput ? DOM.apiKeyInput.value.trim() : '';
    const model = DOM.modelSelect ? DOM.modelSelect.value : 'gemini-1.5-flash-latest'; // Default model
    const temperature = DOM.temperatureInput ? parseFloat(DOM.temperatureInput.value) : 0.7;
    const tone = DOM.toneSelect ? (DOM.toneSelect.value || 'Neutral') : 'Neutral';
    const targetLang = DOM.langTargetSelect ? (DOM.langTargetSelect.value || 'en') : 'en';
    const inputText = DOM.promptInput ? DOM.promptInput.value.trim() : '';
    const originalInputText = DOM.promptInput ? DOM.promptInput.value : ''; // Keep original for comparison display
    const outputFilename = DOM.filenameInput ? DOM.filenameInput.value.trim() : '';


    return {
        apiKey,
        model,
        temperature,
        tone,
        targetLang,
        inputText,
        originalInputText, // To show the original input even if inputText is processed
        outputFilename
    };
}
