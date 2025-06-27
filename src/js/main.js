// src/js/main.js
console.log("main.js: Script loaded."); // DEBUG

import * as DOM from './ui/domElements.js';
import { initializeTheme, applyThemeOnLoad, attachThemeToggleToTitle } from './core/themeService.js';
import { initializeI18n, getCurrentTranslations, setupLanguageSwitcher, loadLanguage } from './core/i18nService.js';
import { initializeSettings, getSettings } from './ui/settingsController.js';
import { initializeFileHandling } from './ui/fileController.js';
// ✅ MODIFIED: Added showProgressMessage for live updates
import { initializeTranslationProcess, displayTranslationResult, clearResponseArea, showTranslatingMessage, showProgressMessage } from './ui/translationController.js';
import { initializeModal } from './ui/modalController.js'; 
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

    // ✅ REFACTORED: The entire translation logic is replaced to support chunking, progress, and cancellation.
    let abortController = null; // To manage stopping the translation

    if (DOM.translateBtn && DOM.stopBtn) {
        DOM.translateBtn.addEventListener('click', async () => {
            const settings = getSettings();
            const t = getCurrentTranslations();

            if (!settings.apiKey || !settings.inputText) {
                return showToast(t.errorMissing, 'error');
            }

            // --- Start Translation Process ---
            DOM.translateBtn.style.display = 'none';
            DOM.stopBtn.style.display = 'block';
            abortController = new AbortController();
            let fullTranslatedText = '';
            let originalFileType = 'srt';

            try {
                // 1. Parse and Chunk Subtitles
                const subtitleBlocks = settings.inputText.trim().split(/\n\s*\n/);
                const CHUNK_SIZE = 50; // Translate 50 subtitle blocks at a time
                const totalChunks = Math.ceil(subtitleBlocks.length / CHUNK_SIZE);
                
                if (settings.inputText.trim().startsWith("WEBVTT")) {
                    originalFileType = 'vtt';
                }

                // 2. Loop through chunks and translate
                for (let i = 0; i < totalChunks; i++) {
                    if (abortController.signal.aborted) {
                        showToast(t.translationCancelled, 'warning');
                        break; // Exit loop if stopped
                    }

                    showProgressMessage(t, i + 1, totalChunks);

                    const chunk = subtitleBlocks.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    let chunkText = chunk.join('\n\n');
                    
                    let processedChunkText = chunkText;
                    // For VTT, each chunk must be treated as a mini-file for parsing
                    if (originalFileType === 'vtt' && chunkText) {
                       try {
                           processedChunkText = vttToInternalSrt("WEBVTT\n\n" + chunkText);
                       } catch(e) {
                           console.warn("Could not parse VTT chunk, sending as is.", e);
                           processedChunkText = chunkText;
                       }
                    }

                    const rawTranslation = await sendToGeminiAPI(
                        processedChunkText,
                        settings.apiKey,
                        settings.model,
                        settings.tone,
                        'fa',
                        settings.temperature,
                        abortController.signal // Pass the signal
                    );

                    if (rawTranslation) {
                        fullTranslatedText += rawTranslation + '\n\n';
                    }
                }

                if (!abortController.signal.aborted) {
                    // 3. Finalize and Display
                    let finalOutput = fixNumbers(fullTranslatedText.trim());
                    if (originalFileType === 'vtt') {
                        // The raw translated text is SRT-like, convert the whole thing back to VTT
                        finalOutput = internalSrtToVTT(finalOutput);
                    }
                    displayTranslationResult(settings.originalInputText, finalOutput, originalFileType, t);
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Fetch aborted by user.');
                    clearResponseArea();
                } else {
                    console.error("Translation process failed:", error);
                    const errorMessageText = (t.errorAPI || "API Error: {message}").replace('{message}', error.message);
                    clearResponseArea();
                    showToast(errorMessageText, 'error');
                }
            } finally {
                // --- Reset UI ---
                DOM.translateBtn.style.display = 'block';
                DOM.stopBtn.style.display = 'none';
                abortController = null;
            }
        });

        DOM.stopBtn.addEventListener('click', () => {
            if (abortController) {
                abortController.abort();
                console.log("Stop button clicked, aborting translation.");
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
