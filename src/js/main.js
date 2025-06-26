// src/js/main.js
console.log("main.js: Script loaded."); // DEBUG

import * as DOM from './ui/domElements.js';
import { initializeTheme, applyThemeOnLoad, attachThemeToggleToTitle } from './core/themeService.js';
import { initializeI18n, getCurrentTranslations, setupLanguageSwitcher, loadLanguage } from './core/i18nService.js';
import { initializeSettings, getSettings } from './ui/settingsController.js';
import { initializeFileHandling } from './ui/fileController.js';
import { initializeTranslationProcess, displayTranslationResult, clearResponseArea, showTranslatingMessage } from './ui/translationController.js';
import { initializeModal } from './ui/modalController.js'; // ✅ NEW: Import modal controller
import { sendToGeminiAPI } from './core/apiService.js';
import { showToast } from './core/toastService.js';
import { isValidSRT, isValidVTT, vttToInternalSrt, internalSrtToVTT, fixNumbers } from './core/subtitleParser.js';

async function mainApp() {
    console.log("main.js: mainApp() started."); // DEBUG

    // 1. Theme: Apply saved/system theme class immediately
    applyThemeOnLoad();
    console.log("main.js: Theme class applied on load."); // DEBUG

    // 2. Internationalization: Load language, then apply all translations
    await initializeI18n();
    console.log("main.js: i18n initialized."); // DEBUG

    // 3. Initialize Theme Toggle logic & ARIA labels (now that i18n is ready)
    initializeTheme();
    attachThemeToggleToTitle();
    console.log("main.js: Theme toggle initialized and attached."); // DEBUG
    
    // ✅ NEW: Initialize Modal System
    initializeModal();
    console.log("main.js: Modal system initialized."); // DEBUG

    // 4. Initialize UI Controllers and other Event Listeners
    initializeSettings();
    console.log("main.js: Settings controller initialized."); // DEBUG
    initializeFileHandling();
    console.log("main.js: File handling initialized."); // DEBUG
    initializeTranslationProcess();
    console.log("main.js: Translation UI (buttons) initialized."); // DEBUG
    setupLanguageSwitcher(loadLanguage);
    console.log("main.js: Language switcher UI setup."); // DEBUG

    // 5. Main Translate Button Logic
    if (DOM.translateBtn) {
        DOM.translateBtn.addEventListener('click', async () => {
            console.log("main.js: Translate button clicked."); // DEBUG
            const settings = getSettings();
            const t = getCurrentTranslations();
            console.log("main.js: Current settings for translation:", settings); // DEBUG

            if (!settings.apiKey || !settings.inputText) {
                console.warn("main.js: API Key or Input Text missing."); // DEBUG
                return showToast(t.errorMissing || 'API Key and Subtitle Text are required.', 'error');
            }

            let processedInputText = settings.inputText;
            let sourceFileType = 'srt';

            if (settings.inputText.trim().startsWith("WEBVTT")) {
                console.log("main.js: VTT content detected."); // DEBUG
                if (!isValidVTT(settings.inputText)) {
                    console.warn("main.js: Invalid VTT content detected by isValidVTT."); // DEBUG
                    return showToast(t.fileValidationVTTError || "Invalid VTT content (header/format).", 'error');
                }
                sourceFileType = 'vtt';
                try {
                    processedInputText = vttToInternalSrt(settings.inputText);
                    console.log("main.js: VTT converted to internal SRT."); // DEBUG
                } catch (e) {
                    console.error("main.js: Error converting VTT to internal SRT:", e); // DEBUG
                    return showToast(t.fileValidationVTTError || e.message, 'error');
                }
            } else if (settings.inputText.includes("-->") && !isValidSRT(settings.inputText)) {
                console.warn("main.js: Invalid SRT content detected by isValidSRT."); // DEBUG
                return showToast(t.fileValidationSRTError || "Invalid SRT content. Please check the format.", 'error');
            }

            showTranslatingMessage(t);
            console.log("main.js: 'Translating...' message shown."); // DEBUG

            try {
                const rawTranslation = await sendToGeminiAPI(
                    processedInputText,
                    settings.apiKey,
                    settings.model,
                    settings.tone,
                    settings.targetLang,
                    settings.temperature
                );
                console.log("main.js: Raw translation received from API."); // DEBUG

                if (!rawTranslation) {
                    console.error("main.js: No raw translation content from API service."); // DEBUG
                    throw new Error(t.errorAPI?.replace('{message}', t.noTranslationContentAPI || 'No content from API.') || 'No translation from API.');
                }

                let finalOutput = fixNumbers(rawTranslation);
                if (sourceFileType === 'vtt') {
                    finalOutput = internalSrtToVTT(finalOutput);
                    console.log("main.js: Translated SRT converted back to VTT."); // DEBUG
                }

                displayTranslationResult(settings.originalInputText, finalOutput, sourceFileType, t);
                console.log("main.js: Translation result displayed."); // DEBUG

            } catch (error) {
                console.error("main.js: Translation process failed:", error); // DEBUG
                const errorMessageText = (t && t.errorAPI) ? t.errorAPI.replace('{message}', error.message) : error.message;
                const unknownErrorText = (t && t.errorUnknown) ? t.errorUnknown : "An unknown error occurred.";
                clearResponseArea();
                showToast(errorMessageText || error.message || unknownErrorText, 'error');
            }
        });
    }

    console.log("main.js: mainApp() finishing initializations."); // DEBUG
    console.log("SubMovies Application Initialized with logging!"); // DEBUG
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js: DOMContentLoaded event fired."); // DEBUG
    mainApp().catch(err => {
        console.error("main.js: Error during mainApp execution:", err);
    });
});
