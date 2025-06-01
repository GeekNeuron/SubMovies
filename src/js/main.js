// src/js/main.js
import * as DOM from './ui/domElements.js';
import { initializeTheme, applyThemeOnLoad, attachThemeToggleToTitle } from './core/themeService.js';
import { initializeI18n, getCurrentTranslations, setupLanguageSwitcher } from './core/i18nService.js'; // Removed loadLanguage as it's used internally by i18nService
import { initializeSettings, getSettings } from './ui/settingsController.js';
import { initializeFileHandling } from './ui/fileController.js'; // Removed getOriginalFileType as it's used internally or by translationController
// Corrected import name here:
import { initializeTranslationProcess, displayTranslationResult, clearResponseArea, showTranslatingMessage } from './ui/translationController.js';
import { sendToGeminiAPI } from './core/apiService.js';
import { showToast } from './core/toastService.js';
import { isValidSRT, isValidVTT, vttToInternalSrt, internalSrtToVTT, fixNumbers } from './core/subtitleParser.js';
// Constants like CHAR_COUNT_WARNING_THRESHOLD would be imported from './utils/constants.js' if used directly here

async function mainApp() {
    // 1. Theme: Apply saved/system theme class immediately
    applyThemeOnLoad(); 
    
    // 2. Internationalization: Load language, then apply all translations
    await initializeI18n(); 

    // 3. Initialize Theme Toggle logic & ARIA labels (now that i18n is ready)
    initializeTheme(); 
    attachThemeToggleToTitle(); 

    // 4. Initialize UI Controllers and other Event Listeners
    initializeSettings(); 
    initializeFileHandling(); 
    initializeTranslationProcess(); // Corrected function name used here
    setupLanguageSwitcher(); 

    // 5. Main Translate Button Logic
    if (DOM.translateBtn) {
        DOM.translateBtn.addEventListener('click', async () => {
            const settings = getSettings(); 
            const t = getCurrentTranslations();

            if (!settings.apiKey || !settings.inputText) {
                return showToast(t.errorMissing || 'API Key and Subtitle Text are required.', 'error');
            }

            let processedInputText = settings.inputText;
            let sourceFileType = 'srt'; 

            // Determine type and process if VTT
            if (settings.inputText.trim().startsWith("WEBVTT")) {
                if (!isValidVTT(settings.inputText)) {
                    return showToast(t.fileValidationVTTError || "Invalid VTT content (header/format).", 'error');
                }
                sourceFileType = 'vtt';
                try {
                    processedInputText = vttToInternalSrt(settings.inputText); 
                } catch (e) {
                    return showToast(t.fileValidationVTTError || e.message, 'error');
                }
            } else if (settings.inputText.includes("-->") && !isValidSRT(settings.inputText)) { 
                 return showToast(t.fileValidationSRTError || "Invalid SRT content. Please check the format.", 'error');
            }
            
            showTranslatingMessage(t);

            try {
                const rawTranslation = await sendToGeminiAPI(
                    processedInputText, 
                    settings.apiKey,
                    settings.model,
                    settings.tone,
                    settings.targetLang,
                    settings.temperature
                );

                if (!rawTranslation) {
                    throw new Error(t.errorAPI?.replace('{message}', t.noTranslationContentAPI || 'No content from API.') || 'No translation from API.');
                }

                let finalOutput = fixNumbers(rawTranslation);
                if (sourceFileType === 'vtt') { 
                    finalOutput = internalSrtToVTT(finalOutput);
                }
                
                displayTranslationResult(settings.originalInputText, finalOutput, sourceFileType, t);

            } catch (error) {
                console.error("Translation process failed in main.js:", error);
                // Ensure 't' is available for error messages or provide hardcoded fallbacks
                const errorMessageText = (t && t.errorAPI) ? t.errorAPI.replace('{message}', error.message) : error.message;
                const unknownErrorText = (t && t.errorUnknown) ? t.errorUnknown : "An unknown error occurred.";
                clearResponseArea(); 
                showToast(errorMessageText || error.message || unknownErrorText, 'error');
            }
        });
    }
    
    console.log("SubMovies Application Initialized!");
}

document.addEventListener('DOMContentLoaded', mainApp);
