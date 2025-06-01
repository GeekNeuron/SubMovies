// src/js/ui/fileController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { showToast } from '../core/toastService.js';
import { isValidSRT, isValidVTT } from '../core/subtitleParser.js';
import { CHAR_COUNT_WARNING_THRESHOLD } from '../utils/constants.js';

let currentOriginalFileType = 'srt'; // To store the detected type of the uploaded file ('srt' or 'vtt')

/**
 * Initializes file input and prompt textarea event listeners.
 * It also sets up the initial state for character count.
 */
export function initializeFileHandling() {
    if (DOM.fileInput) {
        DOM.fileInput.addEventListener('change', handleFileSelect);
    }
    if (DOM.promptInput) {
        // Corrected arrow function syntax here:
        DOM.promptInput.addEventListener('input', () => { 
            updateCharCountUI(); // Update char count on manual input
            // If user types directly, we can't be sure of the file type.
            // The main translation logic will attempt to parse based on content.
            // For download purposes, if text is pasted, we might default to 'srt'.
            if (DOM.fileNameText) { // Clear file name if text is manually entered/changed
                const t = getCurrentTranslations();
                // Ensure t and t.fileNone exist before using, or provide a hardcoded fallback if necessary
                DOM.fileNameText.textContent = (t && t.fileNone !== undefined) ? t.fileNone : ''; 
            }
            currentOriginalFileType = 'srt'; // Default if text is pasted
        });
    }
    // Initial character count update for any pre-filled text (e.g., browser cache)
    if (DOM.promptInput && DOM.promptInput.value) {
        updateCharCountUI();
    } else if (DOM.charCountDisplay) { // Ensure char count is initialized even if prompt is empty
         updateCharCountUI();
    }
}

/**
 * Handles the file selection event from the file input.
 * Reads the file content and updates the UI.
 * @param {Event} event - The file input change event.
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    const t = getCurrentTranslations(); 
    currentOriginalFileType = 'srt'; // Default

    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = file ? file.name : (t.fileNone !== undefined ? t.fileNone : '');
    }

    if (!file) {
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCountUI();
        return;
    }

    if (file.name.toLowerCase().endsWith('.vtt')) {
        currentOriginalFileType = 'vtt';
    } else if (file.name.toLowerCase().endsWith('.srt')) {
        currentOriginalFileType = 'srt';
    } else {
        showToast(t.unsupportedFileType || "Unsupported file type. Please upload .srt or .vtt", "error");
        if (DOM.fileNameText) DOM.fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCountUI();
        event.target.value = ''; // Reset file input
        return;
    }

    try {
        const text = await file.text();
        if (DOM.promptInput) DOM.promptInput.value = text;
        updateCharCountUI(); 

        // Perform basic validation based on detected type after loading content
        if (currentOriginalFileType === 'vtt' && !isValidVTT(text)) {
            showToast(t.fileValidationVTTError || "Invalid VTT file. Missing WEBVTT header or malformed.", "error");
        } else if (currentOriginalFileType === 'srt' && !isValidSRT(text)) {
            showToast(t.fileValidationSRTError || "Invalid SRT file. Please check format.", "error");
        }

    } catch (err) {
        console.error("Error reading file:", err);
        const fileReadErrorMsg = (t.errorFileRead || "Error reading file:") + " " + err.message;
        showToast(fileReadErrorMsg, 'error');
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCountUI();
        if (DOM.fileNameText) DOM.fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
    }
}

/**
 * Updates the character count display in the UI.
 * Shows a warning if the character count exceeds a defined threshold.
 */
function updateCharCountUI() {
    if (!DOM.promptInput || !DOM.charCountDisplay) return;

    const charLength = DOM.promptInput.value.length;
    const t = getCurrentTranslations();
    
    const charCountLabelKey = 'charCountLabel';
    // Provide a safe fallback for the label itself if t or t[charCountLabelKey] is undefined
    const charCountTextTemplate = (t && t[charCountLabelKey] !== undefined) ? t[charCountLabelKey] : "Characters: {count}";
    DOM.charCountDisplay.textContent = charCountTextTemplate.replace('{count}', charLength);

    if (charLength > CHAR_COUNT_WARNING_THRESHOLD) {
        DOM.charCountDisplay.style.color = 'var(--danger-color)';
    } else {
        DOM.charCountDisplay.style.color = 'var(--text-color-secondary)';
    }
}
// Expose globally for i18nService to call after language change.
window.updateCharCountGlobal = updateCharCountUI;


/**
 * Gets the detected original file type ('srt' or 'vtt') of the currently loaded/pasted content.
 * @returns {string} The file type string.
 */
export function getOriginalFileType() {
    if (DOM.promptInput && DOM.promptInput.value.trim().startsWith("WEBVTT")) {
        return 'vtt';
    }
    return currentOriginalFileType;
}
