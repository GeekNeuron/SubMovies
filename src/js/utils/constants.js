export const CHAR_COUNT_WARNING_THRESHOLD = 15000;

export const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
export const DEFAULT_TEMPERATURE = 0.7;
// Fallback tone used only if the language file's `tones` array is unavailable.
// Must match one of the actual values in fa.json's "tones" array.
export const DEFAULT_TONE = 'معیار';
// Target language that subtitles get translated INTO (independent from the UI language)
export const DEFAULT_TARGET_LANG = 'fa';
export const APP_VERSION = '1.0.0';

// Local storage keys
// Kept the original key name for Gemini so existing saved keys aren't lost.
export const LS_API_KEY_GEMINI = 'submovies_apiKeyVal';
export const LS_API_KEY_DEEPSEEK = 'submovies_apiKeyVal_deepseek';
export const LS_API_KEY_ANTHROPIC = 'submovies_apiKeyVal_anthropic';
export const LS_SAVE_API_KEY_PREF = 'submovies_saveApiKeySetting';
export const LS_THEME = 'submovies_theme';
export const LS_TEMPERATURE = 'submovies_temperatureSetting';
export const LS_LAST_MODEL = 'submovies_lastModel';
export const LS_CUSTOM_PROMPT = 'submovies_customPrompt';
// Chunk size (how many subtitle blocks are sent to the API per request)
export const LS_LAST_CHUNK_SIZE = 'submovies_lastChunkSize';
export const CHUNK_SIZE_OPTIONS = [25, 50, 100]; // Optimal, High, Very High
export const DEFAULT_CHUNK_SIZE = 50;
// Delay (in seconds) inserted between consecutive chunk requests, to avoid
// hitting provider rate limits on large files.
export const LS_LAST_RATE_LIMIT_DELAY = 'submovies_lastRateLimitDelay';
export const RATE_LIMIT_DELAY_OPTIONS = [0, 1, 3, 6]; // Off, Low, Medium, High
export const DEFAULT_RATE_LIMIT_DELAY = 0;
// Whether to auto-wrap overly-long translated lines (SRT/VTT only)
export const LS_POST_PROCESS_ENABLED = 'submovies_postProcessEnabled';
export const POST_PROCESS_MAX_CHARS_PER_LINE = 42;
// Manual (no-AI) translation mode: persists the toggle state, the original
// subtitle text currently loaded into the editor, and every translation the
// user has typed so far - so a reload never loses in-progress manual work.
export const LS_MANUAL_MODE_ENABLED = 'submovies_manualModeEnabled';
export const LS_MANUAL_ORIGINAL_TEXT = 'submovies_manualOriginalText';
export const LS_MANUAL_TRANSLATIONS = 'submovies_manualTranslations';
// UI language (interface language) preference
export const LS_UI_LANG = 'submovies_uiLang';
// Target language (translation output language) preference
export const LS_LAST_TARGET_LANG = 'submovies_lastTargetLang';

// Storing tone by index for better cross-language persistence
export const LS_LAST_TONE_INDEX = 'submovies_lastToneIndex';
