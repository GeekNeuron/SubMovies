// src/js/utils/constants.js

// Threshold for showing a warning about long subtitle text
export const CHAR_COUNT_WARNING_THRESHOLD = 15000; // Characters

// API request timeout (example, not currently implemented in fetch calls)
// export const API_REQUEST_TIMEOUT = 300000; // 5 minutes in milliseconds

// Default settings if not found in localStorage or UI elements don't provide a value
export const DEFAULT_MODEL = 'gemini-1.5-flash-latest'; // Ensure this is a valid model ID
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_TONE = 'Neutral'; // Should match one of the values in lang files' "tones" array
export const DEFAULT_TARGET_LANG = 'en'; // Default target language code

// Allowed UI languages for the application
export const ALLOWED_UI_LANGS = ['en', 'fa'];

// Default UI language if no preference is found
export const DEFAULT_UI_LANG = 'en';

// Add other application-wide constants as needed
// For example, API base URLs if they were not hardcoded in apiService.js
// export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

// Local storage keys
export const LS_API_KEY = 'submovies_apiKeyVal';
export const LS_SAVE_API_KEY_PREF = 'submovies_saveApiKeySetting';
export const LS_THEME = 'submovies_theme';
export const LS_LANG = 'submovies_selectedLang';
export const LS_TEMPERATURE = 'submovies_temperatureSetting';
// Add keys for other persisted settings if any (e.g., last selected model, tone, targetLang)
export const LS_LAST_MODEL = 'submovies_lastModel';
export const LS_LAST_TONE = 'submovies_lastTone';
export const LS_LAST_TARGET_LANG = 'submovies_lastTargetLang';
