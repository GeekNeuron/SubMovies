// src/js/ui/settingsController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations, switchUILanguage, getCurrentLanguageCode, SUPPORTED_LANGUAGES } from '../core/i18nService.js';
import { openModal } from './modalController.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAME, getProviderForModel } from '../utils/providers.js';
import {
    LS_API_KEY_GEMINI, LS_API_KEY_DEEPSEEK, LS_API_KEY_ANTHROPIC, LS_SAVE_API_KEY_PREF, LS_TEMPERATURE,
    LS_LAST_MODEL, LS_LAST_TONE_INDEX, LS_LAST_TARGET_LANG, LS_CUSTOM_PROMPT,
    LS_LAST_CHUNK_SIZE, CHUNK_SIZE_OPTIONS, DEFAULT_CHUNK_SIZE,
    LS_LAST_RATE_LIMIT_DELAY, RATE_LIMIT_DELAY_OPTIONS, DEFAULT_RATE_LIMIT_DELAY,
    LS_POST_PROCESS_ENABLED,
    DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_TONE, DEFAULT_TARGET_LANG
} from '../utils/constants.js';

let settingsCache = {};

function getApiKeyStorageKeyForProvider(provider) {
    if (provider === PROVIDERS.DEEPSEEK) return LS_API_KEY_DEEPSEEK;
    if (provider === PROVIDERS.ANTHROPIC) return LS_API_KEY_ANTHROPIC;
    return LS_API_KEY_GEMINI;
}

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

    // Model Selection (determines the active provider)
    const savedModel = localStorage.getItem(LS_LAST_MODEL) || DEFAULT_MODEL;
    if (t.models && DOM.modelSelectBtn) {
        const modelText = t.models[savedModel] || savedModel;
        DOM.modelSelectBtn.textContent = modelText;
    }
    settingsCache.model = savedModel;

    // API Key: loaded per-provider, based on the currently selected model
    const provider = getProviderForModel(savedModel);
    updateApiKeyFieldForProvider(provider);

    // Temperature
    const savedTemp = localStorage.getItem(LS_TEMPERATURE) || DEFAULT_TEMPERATURE.toString();
    if(DOM.temperatureInput) DOM.temperatureInput.value = savedTemp;
    if(DOM.temperatureValueDisplay) DOM.temperatureValueDisplay.textContent = savedTemp;

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

    // Target language (the language subtitles get translated INTO).
    // Independent of the UI language - persisted separately.
    const savedTargetLang = localStorage.getItem(LS_LAST_TARGET_LANG) || DEFAULT_TARGET_LANG;
    const targetLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === savedTargetLang);
    if (DOM.langTargetSelectBtn) {
        DOM.langTargetSelectBtn.textContent = targetLangInfo ? targetLangInfo.name : savedTargetLang;
    }
    settingsCache.targetLang = savedTargetLang;

    // Custom prompt (optional free-form instructions)
    const savedCustomPrompt = localStorage.getItem(LS_CUSTOM_PROMPT) || '';
    if (DOM.customPromptInput) DOM.customPromptInput.value = savedCustomPrompt;

    // Chunk size (how many subtitle blocks are sent per API request)
    const savedChunkSize = parseInt(localStorage.getItem(LS_LAST_CHUNK_SIZE), 10) || DEFAULT_CHUNK_SIZE;
    if (DOM.chunkSizeSelectBtn) {
        DOM.chunkSizeSelectBtn.textContent = getChunkSizeLabel(savedChunkSize, t);
    }
    settingsCache.chunkSize = savedChunkSize;

    // Rate limit delay (seconds between consecutive chunk requests)
    const savedRateLimitStr = localStorage.getItem(LS_LAST_RATE_LIMIT_DELAY);
    const savedRateLimit = savedRateLimitStr !== null ? parseInt(savedRateLimitStr, 10) : DEFAULT_RATE_LIMIT_DELAY;
    if (DOM.rateLimitSelectBtn) {
        DOM.rateLimitSelectBtn.textContent = getRateLimitLabel(savedRateLimit, t);
    }
    settingsCache.rateLimitDelay = savedRateLimit;

    // Post-processing (auto-wrap long lines)
    const savedPostProcess = localStorage.getItem(LS_POST_PROCESS_ENABLED) === 'true';
    if (DOM.postProcessToggle) DOM.postProcessToggle.checked = savedPostProcess;
    settingsCache.postProcessEnabled = savedPostProcess;

    // UI language switcher button label (native name of the current UI language)
    if (DOM.languageSelectBtn) {
        const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === getCurrentLanguageCode());
        DOM.languageSelectBtn.textContent = `🌐 ${currentLangInfo ? currentLangInfo.name : getCurrentLanguageCode()}`;
    }
}

/**
 * Updates the API key input's value and the "(Gemini)"/"(DeepSeek)" tag next
 * to its label to reflect whichever provider is currently selected. Each
 * provider's key is stored/loaded independently, so switching models never
 * loses or overwrites the other provider's saved key.
 * @param {string} provider - one of PROVIDERS.*
 */
function updateApiKeyFieldForProvider(provider) {
    settingsCache.provider = provider;

    if (DOM.apiKeyProviderTag) {
        DOM.apiKeyProviderTag.textContent = `(${PROVIDER_DISPLAY_NAME[provider] || provider})`;
    }

    const savePref = localStorage.getItem(LS_SAVE_API_KEY_PREF) === 'true';
    if (DOM.saveApiKeyCheckbox) DOM.saveApiKeyCheckbox.checked = savePref;

    if (DOM.apiKeyInput) {
        const storageKey = getApiKeyStorageKeyForProvider(provider);
        DOM.apiKeyInput.value = savePref ? (localStorage.getItem(storageKey) || '') : '';
    }
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
    if(DOM.langTargetSelectBtn) DOM.langTargetSelectBtn.addEventListener('click', handleTargetLangSelect);
    if(DOM.languageSelectBtn) DOM.languageSelectBtn.addEventListener('click', handleUILanguageSelect);
    if(DOM.customPromptInput) DOM.customPromptInput.addEventListener('input', handleCustomPromptInput);
    if(DOM.chunkSizeSelectBtn) DOM.chunkSizeSelectBtn.addEventListener('click', handleChunkSizeSelect);
    if(DOM.rateLimitSelectBtn) DOM.rateLimitSelectBtn.addEventListener('click', handleRateLimitSelect);
    if(DOM.postProcessToggle) DOM.postProcessToggle.addEventListener('change', handlePostProcessChange);
}

/**
 * Returns the localized label for a chunk size value (e.g. "Optimal (Recommended)").
 * @param {number} size
 * @param {object} t - current translations
 * @returns {string}
 */
function getChunkSizeLabel(size, t) {
    const idx = CHUNK_SIZE_OPTIONS.indexOf(size);
    if (idx === 0) return t.chunkSizeOptimal || `Optimal (${size})`;
    if (idx === 1) return t.chunkSizeHigh || `High (${size})`;
    if (idx === 2) return t.chunkSizeVeryHigh || `Very High (${size})`;
    return String(size);
}

function handleChunkSizeSelect() {
    const t = getCurrentTranslations();
    const labels = [t.chunkSizeOptimal, t.chunkSizeHigh, t.chunkSizeVeryHigh];
    const options = CHUNK_SIZE_OPTIONS.map((size, i) => ({ value: String(size), text: labels[i] || String(size) }));

    openModal(t.chunkSizeLabel, options, String(settingsCache.chunkSize), (selectedValue) => {
        const size = parseInt(selectedValue, 10);
        DOM.chunkSizeSelectBtn.textContent = getChunkSizeLabel(size, t);
        localStorage.setItem(LS_LAST_CHUNK_SIZE, size);
        settingsCache.chunkSize = size;
    });
}

/**
 * Returns the localized label for a rate-limit delay value (e.g. "Low (1s)").
 * @param {number} delay - seconds
 * @param {object} t - current translations
 * @returns {string}
 */
function getRateLimitLabel(delay, t) {
    const idx = RATE_LIMIT_DELAY_OPTIONS.indexOf(delay);
    const labels = [t.rateLimitOff, t.rateLimitLow, t.rateLimitMedium, t.rateLimitHigh];
    return labels[idx] || `${delay}s`;
}

function handleRateLimitSelect() {
    const t = getCurrentTranslations();
    const labels = [t.rateLimitOff, t.rateLimitLow, t.rateLimitMedium, t.rateLimitHigh];
    const options = RATE_LIMIT_DELAY_OPTIONS.map((delay, i) => ({ value: String(delay), text: labels[i] || `${delay}s` }));

    openModal(t.rateLimitLabel, options, String(settingsCache.rateLimitDelay), (selectedValue) => {
        const delay = parseInt(selectedValue, 10);
        DOM.rateLimitSelectBtn.textContent = getRateLimitLabel(delay, t);
        localStorage.setItem(LS_LAST_RATE_LIMIT_DELAY, delay);
        settingsCache.rateLimitDelay = delay;
    });
}

function handlePostProcessChange() {
    const enabled = DOM.postProcessToggle.checked;
    localStorage.setItem(LS_POST_PROCESS_ENABLED, enabled ? 'true' : 'false');
    settingsCache.postProcessEnabled = enabled;
}

function handleSaveApiKeyChange() {
    const storageKey = getApiKeyStorageKeyForProvider(settingsCache.provider);
    if (DOM.saveApiKeyCheckbox.checked) {
        localStorage.setItem(storageKey, DOM.apiKeyInput.value);
        localStorage.setItem(LS_SAVE_API_KEY_PREF, 'true');
    } else {
        localStorage.removeItem(storageKey);
        localStorage.setItem(LS_SAVE_API_KEY_PREF, 'false');
    }
}

function handleApiKeyInput() {
    if (DOM.saveApiKeyCheckbox.checked) {
        const storageKey = getApiKeyStorageKeyForProvider(settingsCache.provider);
        localStorage.setItem(storageKey, DOM.apiKeyInput.value);
    }
}

function handleTemperatureChange(event) {
    if(DOM.temperatureValueDisplay) DOM.temperatureValueDisplay.textContent = event.target.value;
    localStorage.setItem(LS_TEMPERATURE, event.target.value);
}

function handleCustomPromptInput() {
    localStorage.setItem(LS_CUSTOM_PROMPT, DOM.customPromptInput.value);
}

function handleModelSelect() {
    const t = getCurrentTranslations();
    const options = Object.entries(t.models || {}).map(([value, text]) => ({ value, text }));
    
    openModal(t.modelLabel, options, settingsCache.model, (selectedValue) => {
        DOM.modelSelectBtn.textContent = (t.models || {})[selectedValue] || selectedValue;
        localStorage.setItem(LS_LAST_MODEL, selectedValue);
        settingsCache.model = selectedValue;

        // If the newly-selected model belongs to a different provider,
        // swap which API key is shown/edited (each provider's key is kept
        // separate so switching back and forth never loses either one).
        const newProvider = getProviderForModel(selectedValue);
        if (newProvider !== settingsCache.provider) {
            updateApiKeyFieldForProvider(newProvider);
        }
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
 * Opens the modal to pick which language subtitles should be translated INTO.
 * This is independent from the UI language.
 */
function handleTargetLangSelect() {
    const t = getCurrentTranslations();
    const options = SUPPORTED_LANGUAGES.map(lang => ({ value: lang.code, text: lang.name }));

    openModal(t.langTargetLabel, options, settingsCache.targetLang, (selectedValue) => {
        const info = SUPPORTED_LANGUAGES.find(l => l.code === selectedValue);
        DOM.langTargetSelectBtn.textContent = info ? info.name : selectedValue;
        localStorage.setItem(LS_LAST_TARGET_LANG, selectedValue);
        settingsCache.targetLang = selectedValue;
    });
}

/**
 * Opens the modal to pick the UI (interface) language.
 */
function handleUILanguageSelect() {
    const t = getCurrentTranslations();
    const options = SUPPORTED_LANGUAGES.map(lang => ({ value: lang.code, text: lang.name }));

    openModal(t.langTargetLabel || 'Language', options, getCurrentLanguageCode(), (selectedValue) => {
        switchUILanguage(selectedValue);
        // Note: switchUILanguage triggers loadAndApplyAllSettings(), which will
        // refresh every button's label (including this one) in the new language.
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
        provider: settingsCache.provider,
        temperature: DOM.temperatureInput ? parseFloat(DOM.temperatureInput.value) : DEFAULT_TEMPERATURE,
        tone: settingsCache.tone,
        targetLang: settingsCache.targetLang || DEFAULT_TARGET_LANG,
        customPrompt: DOM.customPromptInput ? DOM.customPromptInput.value.trim() : '',
        chunkSize: settingsCache.chunkSize || DEFAULT_CHUNK_SIZE,
        rateLimitDelay: settingsCache.rateLimitDelay ?? DEFAULT_RATE_LIMIT_DELAY,
        postProcessEnabled: !!settingsCache.postProcessEnabled,
        inputText: DOM.promptInput ? DOM.promptInput.value.trim() : '',
        originalInputText: DOM.promptInput ? DOM.promptInput.value : '',
    };
}
