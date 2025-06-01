// src/js/ui/translationController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { showToast } from '../core/toastService.js';
// getOriginalFileType will be imported and used in main.js before calling download

let lastTranslatedTextForCopy = ""; 
let lastOriginalFileTypeForDownload = 'srt'; // Default, updated by main logic

/**
 * Initializes translation output related event listeners (download, copy).
 */
export function initializeTranslationProcess() { // Renamed to reflect it sets up listeners for the process
    if (DOM.downloadBtn) {
        DOM.downloadBtn.addEventListener('click', handleDownload);
    }
    if (DOM.copyTranslatedBtn) {
        DOM.copyTranslatedBtn.addEventListener('click', handleCopyToClipboard);
    }
}

/**
 * Displays the "Translating..." message in the response area.
 * @param {object} t - The current translation object from i18nService.
 */
export function showTranslatingMessage(t) {
    if (DOM.responseSection) DOM.responseSection.style.display = 'block';
    if (DOM.responseTitle) {
        DOM.responseTitle.style.display = 'block';
        DOM.responseTitle.textContent = t.responseTitle || "Translation Result:"; // Ensure title is set
    }
    if (DOM.responseBox) {
        DOM.responseBox.innerHTML = ''; 
        DOM.responseBox.textContent = t.translatingPlaceholder !== undefined ? t.translatingPlaceholder : 'Translating... please wait.';
    }
    if (DOM.downloadBtn) DOM.downloadBtn.style.display = 'none';
    if (DOM.copyTranslatedBtn) DOM.copyTranslatedBtn.style.display = 'none';
    lastTranslatedTextForCopy = "";
}

/**
 * Clears the response area and can display an error message.
 * Typically called when a new translation starts or an error occurs.
 * @param {string} [messageToDisplay] - Optional message to show (e.g., error).
 * @param {string} [messageType='info'] - Type, mainly for styling if message is error.
 */
export function clearResponseArea(messageToDisplay, messageType = 'info') {
    if (DOM.responseBox) DOM.responseBox.innerHTML = '';
    
    if (messageToDisplay) {
        if (DOM.responseTitle) DOM.responseTitle.style.display = 'none'; // Hide "Translation Result" on error
        // The toast service primarily handles error display.
        // If you want errors in the responseBox:
        // if (DOM.responseBox) {
        //     DOM.responseBox.textContent = messageToDisplay;
        //     if (messageType === 'error') DOM.responseBox.style.color = 'var(--danger-color)';
        // }
    } else {
        // If just clearing for a new translation, ensure title is ready
        if (DOM.responseTitle) DOM.responseTitle.style.display = 'block';
    }
    
    if (DOM.downloadBtn) DOM.downloadBtn.style.display = 'none';
    if (DOM.copyTranslatedBtn) DOM.copyTranslatedBtn.style.display = 'none';
    lastTranslatedTextForCopy = "";
}


/**
 * Displays the original and translated text in a side-by-side comparison.
 * @param {string} originalText - The original subtitle text (as input by user).
 * @param {string} translatedText - The final, processed translated subtitle text.
 * @param {string} originalFileType - The original file type ('srt' or 'vtt') for download.
 * @param {object} t - The current translation object from i18nService.
 */
export function displayTranslationResult(originalText, translatedText, originalFileType, t) {
    lastTranslatedTextForCopy = translatedText;
    lastOriginalFileTypeForDownload = originalFileType; // Store for download button

    if (DOM.responseBox) {
        DOM.responseBox.innerHTML = ''; // Clear "Translating..."
        DOM.responseBox.appendChild(renderComparisonHTML(originalText, translatedText, t));
    }
    if (DOM.downloadBtn) DOM.downloadBtn.style.display = 'block'; // Or 'inline-block' if using .btn class structure
    if (DOM.copyTranslatedBtn) DOM.copyTranslatedBtn.style.display = 'inline-block';
    
    if (DOM.responseSection) DOM.responseSection.style.display = 'block';
    if (DOM.responseTitle) {
        DOM.responseTitle.style.display = 'block';
        DOM.responseTitle.textContent = t.responseTitle || "Translation Result:"; // Ensure title is set correctly
    }
}

/**
 * Creates the HTML structure for the side-by-side comparison view.
 * @param {string} orig - Original text.
 * @param {string} translated - Translated text.
 * @param {object} t - Current translation object for localized titles.
 * @returns {HTMLElement} The container element with the comparison.
 */
function renderComparisonHTML(orig, translated, t) {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mt-2';

    const createSubtitleBox = (titleKey, defaultTitle, content) => {
        const boxContainer = document.createElement('div');
        const titleEl = document.createElement('h3');
        titleEl.className = 'text-lg font-semibold mb-2';
        titleEl.textContent = t[titleKey] || defaultTitle;
        
        const preEl = document.createElement('pre');
        preEl.className = 'p-3 rounded-md text-sm max-h-80 sm:max-h-96 overflow-y-auto border';
        preEl.style.backgroundColor = 'var(--input-bg)'; 
        preEl.style.borderColor = 'var(--input-border)'; 
        preEl.style.color = 'var(--input-text)'; // Ensure pre text color matches theme
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
 * Handles the download of the translated subtitle file.
 */
function handleDownload() {
    const t = getCurrentTranslations();
    if (!lastTranslatedTextForCopy) {
        showToast(t.errorNoDownloadText || "No translated text to download.", "error");
        return;
    }

    let filename = DOM.filenameInput.value.trim();
    const extension = lastOriginalFileTypeForDownload; // Use the stored type

    if (!filename) {
        const uploadedFileName = DOM.fileInput.files[0]?.name;
        const originalBaseFileName = uploadedFileName ? uploadedFileName.replace(/\.(srt|vtt)$/i, '') : 'translated_subtitle';
        const targetLangCode = DOM.langTargetSelect.value || 'trans';
        filename = `${originalBaseFileName}_${targetLangCode}.${extension}`;
    } else {
        // Ensure filename has the correct extension based on original file type
        const currentExtMatch = filename.match(/\.(srt|vtt)$/i);
        if (currentExtMatch && currentExtMatch[1].toLowerCase() !== extension) {
            // If has an extension but it's the wrong one, replace it
            filename = filename.substring(0, filename.lastIndexOf('.')) + `.${extension}`;
        } else if (!currentExtMatch) {
            // If no extension, add the correct one
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
 * Handles copying the translated text to the user's clipboard.
 */
function handleCopyToClipboard() {
    const t = getCurrentTranslations();
    if (!lastTranslatedTextForCopy) {
        showToast(t.errorNoDownloadText || "No translated text available to copy.", 'error');
        return;
    }
    navigator.clipboard.writeText(lastTranslatedTextForCopy).then(() => {
        showToast(t.copySuccess || "Copied to clipboard!", 'success');
    }).catch(err => {
        console.error('Clipboard API copy failed: ', err);
        // Fallback method for older browsers or insecure contexts (HTTP)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = lastTranslatedTextForCopy;
            textArea.style.position = "fixed";  // Prevent scrolling to bottom
            textArea.style.opacity = "0"; // Hide the textarea
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                showToast(t.copySuccess || "Copied to clipboard! (fallback)", 'success');
            } else {
                throw new Error('Fallback copy command failed.');
            }
        } catch (fallbackErr) {
            console.error('Fallback copy method also failed: ', fallbackErr);
            showToast(t.copyFail || "Failed to copy text. Please try manually.", 'error');
        }
    });
}
