// src/js/ui/fileController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { showToast } from '../core/toastService.js';
import { CHAR_COUNT_WARNING_THRESHOLD } from '../utils/constants.js'; // Assuming constants.js

let currentOriginalFileType = 'srt'; // To store the detected type of the uploaded file

/**
 * Initializes file input and prompt textarea event listeners.
 * @param {function} getTranslationsFunc - Function to get current translations object.
 */
export function initializeFileHandling(getTranslationsFunc) {
    if (DOM.fileInput) {
        DOM.fileInput.addEventListener('change', async (e) => {
            await handleFileSelect(e, getTranslationsFunc);
        });
    }
    if (DOM.promptInput) {
        DOM.promptInput.addEventListener('input', () => {
            updateCharCount(getTranslationsFunc);
            // If user types directly, we might not know the file type, assume srt or let parser handle it
            currentOriginalFileType = 'srt'; // Or a more generic 'text'
            if (DOM.fileNameText) { // Clear file name if text is manually entered/changed
                const t = getTranslationsFunc();
                DOM.fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
            }
        });
    }
    // Initial character count update if there's pre-filled text (e.g. from browser cache)
    if (DOM.promptInput && DOM.promptInput.value) {
        updateCharCount(getTranslationsFunc);
    }
}

/**
 * Handles the file selection event.
 * Reads the file content and updates the UI.
 * @param {Event} event - The file input change event.
 * @param {function} getTranslationsFunc - Function to get current translations object.
 */
async function handleFileSelect(event, getTranslationsFunc) {
    const file = event.target.files[0];
    const t = getTranslationsFunc();
    currentOriginalFileType = 'srt'; // Default

    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = file ? file.name : (t.fileNone !== undefined ? t.fileNone : '');
    }

    if (!file) {
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCount(getTranslationsFunc);
        return;
    }

    // Basic file type check by extension for UI feedback, parser will do more robust check
    if (file.name.toLowerCase().endsWith('.vtt')) {
        currentOriginalFileType = 'vtt';
    } else if (file.name.toLowerCase().endsWith('.srt')) {
        currentOriginalFileType = 'srt';
    } else {
        showToast(t.unsupportedFileType || "Unsupported file type. Please upload .srt or .vtt", "error");
        if (DOM.fileNameText) DOM.fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCount(getTranslationsFunc);
        event.target.value = ''; // Reset file input
        return;
    }

    try {
        const text = await file.text();
        if (DOM.promptInput) DOM.promptInput.value = text;
        updateCharCount(getTranslationsFunc);
    } catch (err) {
        console.error("Error reading file:", err);
        const fileReadErrorMsg = (t.errorFileRead || "Error reading file:") + " " + err.message;
        showToast(fileReadErrorMsg, 'error');
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCount(getTranslationsFunc);
        if (DOM.fileNameText) DOM.fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
    }
}

/**
 * Updates the character count display and shows a warning if too long.
 * @param {function} getTranslationsFunc - Function to get current translations object.
 */
function updateCharCount(getTranslationsFunc) {
    if (!DOM.promptInput || !DOM.charCountDisplay) return;

    const charLength = DOM.promptInput.value.length;
    const t = getTranslationsFunc();
    
    const charCountLabel = t.charCountLabel || "Characters: {count}";
    DOM.charCountDisplay.textContent = charCountLabel.replace('{count}', charLength);

    if (charLength > CHAR_COUNT_WARNING_THRESHOLD) {
        DOM.charCountDisplay.style.color = 'var(--danger-color)'; // Use CSS variable
        // Consider showing a more persistent warning or a one-time toast
        // showToast(t.charCountWarning || "Warning: Very long text may hit API limits.", 'warn');
    } else {
        DOM.charCountDisplay.style.color = 'var(--text-color-secondary)';
    }
}
// Expose updateCharCount globally if i18nService needs to call it after lang change
// This is not ideal, better to pass it or have i18nService emit an event.
window.updateCharCount = () => updateCharCount(getCurrentTranslations);


/**
 * Gets the detected original file type based on upload or manual input.
 * @returns {string} 'srt' or 'vtt' or 'text' (if unknown from textarea)
 */
export function getOriginalFileType() {
    // If text was pasted directly and not from a file, we might not know.
    // The main translation logic will try to parse it.
    // For now, this relies on the file input's detection.
    return currentOriginalFileType;
}
