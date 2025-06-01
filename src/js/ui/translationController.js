// src/js/ui/translationController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { showToast } from '../core/toastService.js';
import { getOriginalFileType } from './fileController.js'; // To determine download extension

let lastTranslatedTextForCopy = ""; // Store the final processed text for copy/download
let lastOriginalFileTypeForDownload = 'srt'; // Store the type for correct download extension

/**
 * Initializes translation output related event listeners (download, copy).
 * @param {function} getTranslationsFunc - Function to get current translations object.
 */
export function initializeTranslationProcess(getTranslationsFunc) { // Renamed for clarity
    if (DOM.downloadBtn) {
        DOM.downloadBtn.addEventListener('click', () => {
            handleDownload(getTranslationsFunc);
        });
    }
    if (DOM.copyTranslatedBtn) {
        DOM.copyTranslatedBtn.addEventListener('click', () => {
            handleCopyToClipboard(getTranslationsFunc);
        });
    }
}

/**
 * Displays the "Translating..." message in the response area.
 * @param {object} t - The current translation object.
 */
export function showTranslatingMessage(t) {
    if (DOM.responseSection) DOM.responseSection.style.display = 'block';
    if (DOM.responseTitle) DOM.responseTitle.style.display = 'block'; // Show title area
    if (DOM.responseBox) {
        DOM.responseBox.innerHTML = ''; // Clear previous content
        DOM.responseBox.textContent = t.translatingPlaceholder !== undefined ? t.translatingPlaceholder : 'Translating... please wait.';
    }
    if (DOM.downloadBtn) DOM.downloadBtn.style.display = 'none';
    if (DOM.copyTranslatedBtn) DOM.copyTranslatedBtn.style.display = 'none';
    lastTranslatedTextForCopy = "";
}

/**
 * Clears the response area and optionally shows an error message.
 * @param {string} [errorMessage] - Optional error message to display.
 * @param {string} [messageType='info'] - Type of message ('info', 'error').
 */
export function clearResponseArea(errorMessage, messageType = 'info') {
    if (DOM.responseBox) DOM.responseBox.innerHTML = '';
    if (DOM.responseTitle && errorMessage) {
        // If there's an error, we might want to hide the "Translation Result" title
        // or change it to "Error"
        DOM.responseTitle.style.display = 'none'; 
    } else if (DOM.responseTitle) {
        DOM.responseTitle.style.display = 'block'; // Ensure it's visible if no error
    }
    
    if (DOM.downloadBtn) DOM.downloadBtn.style.display = 'none';
    if (DOM.copyTranslatedBtn) DOM.copyTranslatedBtn.style.display = 'none';
    lastTranslatedTextForCopy = "";

    if (errorMessage && DOM.responseBox) {
        // Optionally display the error directly in the response box if it's persistent
        // For now, toast handles errors primarily.
        // DOM.responseBox.textContent = errorMessage;
        // DOM.responseBox.style.color = (messageType === 'error') ? 'var(--danger-color)' : 'var(--text-color-primary)';
    }
}


/**
 * Displays the original and translated text in a side-by-side comparison.
 * @param {string} originalText - The original subtitle text.
 * @param {string} translatedText - The translated subtitle text.
 * @param {string} originalFileTypeForDownload - 'srt' or 'vtt', for download extension.
 * @param {object} t - The current translation object.
 */
export function displayTranslationResult(originalText, translatedText, originalFileTypeForDownload, t) {
    lastTranslatedTextForCopy = translatedText;
    lastOriginalFileTypeForDownload = originalFileTypeForDownload;

    if (DOM.responseBox) {
        DOM.responseBox.innerHTML = ''; // Clear "Translating..."
        DOM.responseBox.appendChild(renderComparisonHTML(originalText, translatedText, t));
    }
    if (DOM.downloadBtn) DOM.downloadBtn.style.display = 'block';
    if (DOM.copyTranslatedBtn) DOM.copyTranslatedBtn.style.display = 'inline-block';
    if (DOM.responseSection) DOM.responseSection.style.display = 'block';
    if (DOM.responseTitle) DOM.responseTitle.style.display = 'block';
}

/**
 * Creates the HTML structure for side-by-side comparison.
 * @param {string} orig - Original text.
 * @param {string} translated - Translated text.
 * @param {object} t - Current translation object.
 * @returns {HTMLElement} The container element with the comparison.
 */
function renderComparisonHTML(orig, translated, t) {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mt-2'; // Tailwind classes

    const createSubtitleBox = (titleKey, defaultTitle, content) => {
        const boxContainer = document.createElement('div');
        const titleEl = document.createElement('h3');
        titleEl.className = 'text-lg font-semibold mb-2'; // Tailwind
        titleEl.textContent = t[titleKey] || defaultTitle;
        
        const preEl = document.createElement('pre');
        preEl.className = 'p-3 rounded-md text-sm max-h-80 overflow-y-auto border'; // Tailwind
        preEl.style.backgroundColor = 'var(--input-bg)'; 
        preEl.style.borderColor = 'var(--input-border)'; 
        preEl.textContent = content;
        
        boxContainer.appendChild(titleEl);
        boxContainer.appendChild(preEl);
        return boxContainer;
    };
    
    container.appendChild(createSubtitleBox('originalTitle', "Original", orig));
    container.appendChild(createSubtitleBox('translatedTitle', "Translated", translated));
    return container;
}

/**
 * Handles the download of the translated text.
 * @param {function} getTranslationsFunc - Function to get current translations object.
 */
function handleDownload(getTranslationsFunc) {
    const t = getTranslationsFunc();
    if (!lastTranslatedTextForCopy) {
        showToast(t.errorNoDownloadText || "No translated text to download.", "error");
        return;
    }

    let filename = DOM.filenameInput.value.trim();
    const extension = lastOriginalFileTypeForDownload; // Use the stored original file type

    if (!filename) {
        const originalBaseFileName = DOM.fileInput.files[0]?.name.replace(/\.(srt|vtt)$/i, '');
        const targetLangCode = DOM.langTargetSelect.value || 'trans';
        filename = originalBaseFileName ? `${originalBaseFileName}_${targetLangCode}.${extension}` : `translated_subtitle_${targetLangCode}.${extension}`;
    } else {
        // Ensure correct extension
        const currentExtMatch = filename.match(/\.(srt|vtt)$/i);
        if (currentExtMatch && currentExtMatch[1].toLowerCase() !== extension) {
            filename = filename.substring(0, filename.lastIndexOf('.')) + `.${extension}`;
        } else if (!currentExtMatch) {
            filename += `.${extension}`;
        }
    }
  
    const blob = new Blob([lastTranslatedTextForCopy], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Handles copying the translated text to the clipboard.
 * @param {function} getTranslationsFunc - Function to get current translations object.
 */
function handleCopyToClipboard(getTranslationsFunc) {
    const t = getTranslationsFunc();
    if (!lastTranslatedTextForCopy) {
        showToast(t.errorNoDownloadText || "No translated text to copy.", 'error'); // Use a specific key if available
        return;
    }
    navigator.clipboard.writeText(lastTranslatedTextForCopy).then(() => {
        showToast(t.copySuccess || "Copied to clipboard!", 'success');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers or if navigator.clipboard is not available (e.g. insecure context)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = lastTranslatedTextForCopy;
            textArea.style.position = "fixed"; // Prevent scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast(t.copySuccess || "Copied to clipboard! (fallback)", 'success');
        } catch (fallbackErr) {
            console.error('Fallback copy method failed: ', fallbackErr);
            showToast(t.copyFail || "Failed to copy.", 'error');
        }
    });
}
