// src/js/main.js
import * as DOM from './ui/domElements.js';
import { initializeTheme, applyThemeOnLoad } from './core/themeService.js';
import { initializeI18n, loadLanguage, getCurrentTranslations, applyCurrentTranslations } from './core/i18nService.js';
import { initializeSettings, getSettings } from './ui/settingsController.js';
import { initializeFileHandling } from './ui/fileController.js';
import { initializeTranslationProcess, displayTranslationResult, clearResponseArea, showTranslatingMessage } from './ui/translationController.js';
import { sendToGeminiAPI } from './core/apiService.js';
import { showToast } from './core/toastService.js';
import { isValidSRT, isValidVTT, vttToInternalSrt, internalSrtToVTT, fixNumbers } from './core/subtitleParser.js';
import { CHAR_COUNT_WARNING_THRESHOLD } from './utils/constants.js'; // Assuming constants.js for such values

// --- Main Application Logic Orchestration ---

async function mainApp() {
    // 1. Initialize Theme (applies saved theme immediately)
    applyThemeOnLoad(); // Applies class to body
    initializeTheme(getCurrentTranslations); // Sets up toggle button, needs translations for ARIA

    // 2. Initialize Internationalization (loads language, then applies translations)
    await initializeI18n(); // This will also call applyCurrentTranslations internally

    // 3. Initialize UI Controllers and Event Listeners
    initializeSettings(getCurrentTranslations);
    initializeFileHandling(getCurrentTranslations);
    
    // Initialize translation process (main button click)
    if (DOM.translateBtn) {
        DOM.translateBtn.addEventListener('click', async () => {
            const settings = getSettings(); // Get all current settings
            const t = getCurrentTranslations();

            if (!settings.apiKey || !settings.inputText) {
                return showToast(t.errorMissing || 'API Key and Subtitle Text are required.', 'error');
            }

            let processedInputText = settings.inputText;
            let originalType = 'srt';

            if (isValidVTT(settings.inputText)) {
                originalType = 'vtt';
                try {
                    processedInputText = vttToInternalSrt(settings.inputText);
                } catch (e) {
                    return showToast(t.fileValidationVTTError || e.message || "Invalid VTT content.", 'error');
                }
            } else if (!isValidSRT(settings.inputText) && settings.inputText.includes("-->")) {
                 return showToast(t.fileValidationSRTError || "Invalid SRT content. Check format.", 'error');
            }
            
            showTranslatingMessage(t);

            try {
                const rawTranslation = await sendToGeminiAPI(
                    processedInputText, // This is now always SRT-like
                    settings.apiKey,
                    settings.model,
                    settings.tone,
                    settings.targetLang,
                    settings.temperature
                );

                if (!rawTranslation) { // Should be caught by apiService, but as a safeguard
                    throw new Error(t.errorAPI?.replace('{message}', 'No content from API.') || 'No content from API.');
                }

                let finalOutput = fixNumbers(rawTranslation);
                if (originalType === 'vtt') {
                    finalOutput = internalSrtToVTT(finalOutput);
                }
                
                displayTranslationResult(settings.originalInputText || settings.inputText, finalOutput, originalType, t);

            } catch (error) {
                console.error("Translation process failed:", error);
                clearResponseArea(t.errorAPI?.replace('{message}', error.message) || error.message, 'error');
                showToast(t.errorAPI?.replace('{message}', error.message) || error.message, 'error');
            }
        });
    }
    
    console.log("SubMovies Application Initialized with Professional Structure!");
}

// Start the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', mainApp);
