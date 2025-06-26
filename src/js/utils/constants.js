// src/js/utils/constants.js

export const CHAR_COUNT_WARNING_THRESHOLD = 15000;

export const DEFAULT_MODEL = 'gemini-1.5-flash-latest';
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_TONE = 'Neutral'; // Fallback tone text
export const DEFAULT_TARGET_LANG = 'en';

export const ALLOWED_UI_LANGS = ['en', 'fa'];
export const DEFAULT_UI_LANG = 'en';

// Local storage keys
export const LS_API_KEY = 'submovies_apiKeyVal';
export const LS_SAVE_API_KEY_PREF = 'submovies_saveApiKeySetting';
export const LS_THEME = 'submovies_theme';
export const LS_LANG = 'submovies_selectedLang';
export const LS_TEMPERATURE = 'submovies_temperatureSetting';
export const LS_LAST_MODEL = 'submovies_lastModel';
// ✅ LOGIC UPDATE: Storing tone by index for better cross-language persistence
export const LS_LAST_TONE_INDEX = 'submovies_lastToneIndex'; 
export const LS_LAST_TARGET_LANG = 'submovies_lastTargetLang';
