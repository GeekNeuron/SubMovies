// src/js/main.js
import * as DOM from './ui/domElements.js'; // Make sure IDs in domElements.js match index.html
import { initializeTheme, applyThemeOnLoad, attachThemeToggleToTitle } from './core/themeService.js';
import { initializeI18n, getCurrentTranslations, setupLanguageSwitcher } from './core/i18nService.js';
import { initializeSettings, getSettings } from './ui/settingsController.js';
import { initializeFileHandling, getOriginalFileType } from './ui/fileController.js';
import { initializeTranslationUI, displayTranslationResult, clearResponseArea, showTranslatingMessage } from './ui/translationController.js'; // initializeTranslationUI was translationProcess
import { sendToGeminiAPI } from './core/apiService.js';
import { showToast } from './core/toastService.js';
import { isValidSRT, isValidVTT, vttToInternalSrt, internalSrtToVTT, fixNumbers } from './core/subtitleParser.js';

async function mainApp() {
    // 1. Theme: Apply saved/system theme class immediately
    applyThemeOnLoad(); 
    
    // 2. Internationalization: Load language, then apply all translations
    await initializeI18n(); // This also calls applyActiveTranslations internally

    // 3. Initialize Theme Toggle logic & ARIA labels (now that i18n is ready)
    initializeTheme(); // Basic init for theme service
    attachThemeToggleToTitle(); // Attaches click listener to the title area

    // 4. Initialize UI Controllers and other Event Listeners
    initializeSettings(); // Handles API key saving, temperature, other settings persistence
    initializeFileHandling(); // Handles file input, char count
    initializeTranslationUI(); // Sets up download/copy button listeners
    setupLanguageSwitcher(); // Sets up new language circle buttons

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

            if (settings.inputText.trim().startsWith("WEBVTT")) {
                if (!isValidVTT(settings.inputText)) { // Validate before processing
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

                if (!rawTranslation) { // Should be caught by apiService, but as a safeguard
                    throw new Error(t.errorAPI?.replace('{message}', t.noTranslationContentAPI || 'No content from API.') || 'No translation from API.');
                }

                let finalOutput = fixNumbers(rawTranslation);
                if (sourceFileType === 'vtt') { 
                    finalOutput = internalSrtToVTT(finalOutput);
                }
                
                displayTranslationResult(settings.originalInputText, finalOutput, sourceFileType, t);

            } catch (error) {
                console.error("Translation process failed in main.js:", error);
                const errorMessage = t.errorAPI?.replace('{message}', error.message) || error.message || (t.errorUnknown || "An unknown error occurred.");
                clearResponseArea(); 
                showToast(errorMessage, 'error');
            }
        });
    }
    
    console.log("SubMovies Application Initialized!");
}

document.addEventListener('DOMContentLoaded', mainApp);
