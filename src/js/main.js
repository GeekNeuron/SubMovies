// src/js/main.js
import * as DOM from './ui/domElements.js';
import { initializeTheme, applyThemeOnLoad, attachThemeToggleToTitle } from './core/themeService.js';
import { initializeI18n, loadLanguage, getCurrentTranslations, applyCurrentTranslations, setupLanguageSwitcher } from './core/i18nService.js';
import { initializeSettings, getSettings } from './ui/settingsController.js';
import { initializeFileHandling, getOriginalFileType } from './ui/fileController.js';
import { initializeTranslationUI, displayTranslationResult, clearResponseArea, showTranslatingMessage } from './ui/translationController.js';
import { sendToGeminiAPI } from './core/apiService.js';
import { showToast } from './core/toastService.js';
import { isValidSRT, isValidVTT, vttToInternalSrt, internalSrtToVTT, fixNumbers } from './core/subtitleParser.js';
// Constants are imported where needed or passed

async function mainApp() {
    // 1. Theme: Apply saved/system theme immediately to avoid FOUC
    applyThemeOnLoad(); 
    
    // 2. Internationalization: Load language, then apply translations
    // This will also trigger an update for theme button ARIA label via a callback/event
    await initializeI18n(); 

    // 3. Initialize Theme Toggle logic (now that i18n might be ready for ARIA labels)
    // The actual theme class was already applied by applyThemeOnLoad
    initializeTheme(getCurrentTranslations); // For ARIA labels
    attachThemeToggleToTitle(); // New: Attaches toggle to title container

    // 4. Initialize UI Controllers and Event Listeners
    initializeSettings(getCurrentTranslations); // For labels and persisting settings
    initializeFileHandling(getCurrentTranslations); // For file input and char count
    initializeTranslationUI(getCurrentTranslations); // For download/copy button listeners
    setupLanguageSwitcher(loadLanguage); // New language switcher UI

    // 5. Main Translate Button Logic
    if (DOM.translateBtn) {
        DOM.translateBtn.addEventListener('click', async () => {
            const settings = getSettings(); // Gets all current values from UI
            const t = getCurrentTranslations();

            if (!settings.apiKey || !settings.inputText) {
                return showToast(t.errorMissing || 'API Key and Subtitle Text are required.', 'error');
            }

            let processedInputText = settings.inputText;
            let sourceFileType = 'srt'; // Default

            // Determine type and process if VTT
            if (isValidVTT(settings.inputText)) {
                sourceFileType = 'vtt';
                try {
                    processedInputText = vttToInternalSrt(settings.inputText); // Convert VTT to internal SRT for API
                } catch (e) {
                    return showToast(t.fileValidationVTTError || e.message || "Invalid VTT content (header/format).", 'error');
                }
            } else if (settings.inputText.includes("-->") && !isValidSRT(settings.inputText)) { 
                 // It looks like an SRT but isn't valid
                 return showToast(t.fileValidationSRTError || "Invalid SRT content. Please check the format.", 'error');
            }
            
            showTranslatingMessage(t); // Update UI to "Translating..."

            try {
                const rawTranslation = await sendToGeminiAPI(
                    processedInputText, // This is now always SRT-like
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
                if (sourceFileType === 'vtt') { // If original was VTT, convert translated SRT-like text back to VTT
                    finalOutput = internalSrtToVTT(finalOutput);
                }
                
                // Pass original user input for comparison, final output, and the *output* file type
                displayTranslationResult(settings.originalInputText, finalOutput, sourceFileType, t);

            } catch (error) {
                console.error("Translation process failed in main.js:", error);
                const errorMessage = t.errorAPI?.replace('{message}', error.message) || error.message || (t.errorUnknown || "An unknown error occurred.");
                clearResponseArea(); // Clear response box
                showToast(errorMessage, 'error');
            }
        });
    }
    
    console.log("SubMovies Application Initialized!");
}

document.addEventListener('DOMContentLoaded', mainApp);
