// src/js/ui/fileController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { showToast } from '../core/toastService.js';
import { isValidSRT, isValidVTT } from '../core/subtitleParser.js'; // For basic validation
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
        DOM.promptInput.addEventListener('input', ()_=> {
            updateCharCountUI(); // Update char count on manual input
            // If user types directly, we can't be sure of the file type.
            // The main translation logic will attempt to parse based on content.
            // For download purposes, if text is pasted, we might default to 'srt' or let user choose.
            // For now, fileNameText is cleared as it's not from a file.
            if (DOM.fileNameText) {
                const t = getCurrentTranslations();
                DOM.fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
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
 * Reads the file content, validates basic format, and updates the UI.
 * @param {Event} event - The file input change event.
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    const t = getCurrentTranslations(); // Get current translations for messages

    if (DOM.fileNameText) {
        DOM.fileNameText.textContent = file ? file.name : (t.fileNone !== undefined ? t.fileNone : '');
    }

    if (!file) {
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCountUI();
        return;
    }

    // Determine file type by extension for initial validation and download type
    if (file.name.toLowerCase().endsWith('.vtt')) {
        currentOriginalFileType = 'vtt';
    } else if (file.name.toLowerCase().endsWith('.srt')) {
        currentOriginalFileType = 'srt';
    } else {
        showToast(t.unsupportedFileType || "Unsupported file type. Please upload .srt or .vtt", "error");
        if (DOM.fileNameText) DOM.fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
        if (DOM.promptInput) DOM.promptInput.value = '';
        updateCharCountUI();
        event.target.value = ''; // Reset file input to allow re-selection of the same file if needed
        return;
    }

    try {
        const text = await file.text();
        if (DOM.promptInput) DOM.promptInput.value = text;
        updateCharCountUI(); // Update char count after loading file content

        // Perform basic validation based on detected type
        if (currentOriginalFileType === 'vtt' && !isValidVTT(text)) {
            showToast(t.fileValidationVTTError || "Invalid VTT file. Missing WEBVTT header or malformed.", "error");
            // Optionally clear prompt: DOM.promptInput.value = ''; updateCharCountUI();
        } else if (currentOriginalFileType === 'srt' && !isValidSRT(text)) {
            showToast(t.fileValidationSRTError || "Invalid SRT file. Please check format.", "error");
            // Optionally clear prompt
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
    const charCountText = (t[charCountLabelKey] || "Characters: {count}").replace('{count}', charLength);
    DOM.charCountDisplay.textContent = charCountText;

    if (charLength > CHAR_COUNT_WARNING_THRESHOLD) {
        DOM.charCountDisplay.style.color = 'var(--danger-color)'; // Uses CSS variable
        // A one-time toast warning might be too intrusive on every input.
        // Consider a more subtle, persistent visual cue or a debounced toast.
    } else {
        DOM.charCountDisplay.style.color = 'var(--text-color-secondary)';
    }
}

// Expose globally for i18nService to call after language change.
// This is a common pattern but can be improved with event emitters or direct module calls if preferred.
window.updateCharCountGlobal = updateCharCountUI;


/**
 * Gets the detected original file type ('srt' or 'vtt') of the currently loaded/pasted content.
 * This is used by other modules (e.g., translationController for download).
 * @returns {string} The file type string.
 */
export function getOriginalFileType() {
    // If text was pasted, this might be less accurate.
    // The translation logic in main.js does a content-based check.
    // This function primarily reflects the type from file upload.
    if (DOM.promptInput && DOM.promptInput.value.trim().startsWith("WEBVTT")) {
        return 'vtt';
    }
    // Add more sophisticated checks if needed for pasted content,
    // otherwise default to currentOriginalFileType which is updated on file select.
    return currentOriginalFileType;
}
