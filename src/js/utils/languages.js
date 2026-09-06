// src/js/utils/languages.js
// Central list of languages supported by SubMovies. Used both for the
// UI-language switcher and the subtitle-translation target-language picker.
// `name` is always the language's own native name (not translated), which is
// the standard convention used by translator UIs (Google Translate, etc.)
// so users can always find their language regardless of the current UI language.

export const SUPPORTED_LANGUAGES = [
    { code: 'fa', name: 'فارسی', englishName: 'Persian (Farsi)', rtl: true },
    { code: 'en', name: 'English', englishName: 'English', rtl: false },
    { code: 'ar', name: 'العربية', englishName: 'Arabic', rtl: true },
    { code: 'tr', name: 'Türkçe', englishName: 'Turkish', rtl: false },
    { code: 'fr', name: 'Français', englishName: 'French', rtl: false },
    { code: 'de', name: 'Deutsch', englishName: 'German', rtl: false },
    { code: 'es', name: 'Español', englishName: 'Spanish', rtl: false },
    { code: 'ru', name: 'Русский', englishName: 'Russian', rtl: false },
    { code: 'zh', name: '中文', englishName: 'Chinese (Simplified)', rtl: false },
    { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', rtl: false },
    { code: 'ja', name: '日本語', englishName: 'Japanese', rtl: false },
    { code: 'pt', name: 'Português', englishName: 'Portuguese', rtl: false },
    { code: 'it', name: 'Italiano', englishName: 'Italian', rtl: false },
];

export function getLanguageInfo(code) {
    return SUPPORTED_LANGUAGES.find(l => l.code === code) || null;
}

export function isRTL(code) {
    const info = getLanguageInfo(code);
    return info ? info.rtl : false;
}
