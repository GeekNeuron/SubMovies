// src/js/ui/translationController.js
import { getOriginalFileName } from './fileController.js';
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { showToast } from '../core/toastService.js';
import { downloadTextAsFile, sanitizeFilename } from '../utils/helpers.js';
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
    document.querySelector('.workspace')?.classList.add('has-result');
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
    container.className = 'compare-grid';

    const createSubtitleBox = (titleKey, defaultTitle, content) => {
        const boxContainer = document.createElement('div');
        boxContainer.className = 'compare-col';
        const titleEl = document.createElement('h3');
        titleEl.textContent = t[titleKey] || defaultTitle;
        
        const preEl = document.createElement('pre');
        preEl.className = 'compare-pre';
        // Fix: isolate this block from the page's RTL bidi context. Without this,
        // the browser's bidi algorithm visually reorders SRT timestamp lines
        // (e.g. "00:00:01,000 --> 00:00:02,000" renders reversed) because the
        // surrounding <html dir="rtl"> influences how weakly-directional
        // characters (digits, "-->", punctuation) get laid out.
        preEl.dir = 'ltr';
        preEl.textContent = content;
        
        boxContainer.appendChild(titleEl);
        boxContainer.appendChild(preEl);
        return boxContainer;
    };
    
    container.appendChild(createSubtitleBox('originalTitle', "Original", orig));
    container.appendChild(createSubtitleBox('translatedTitle', "Translated", translated));
    return container;
}

// ++++++++++++++ این تابع کامل جایگزین شود ++++++++++++++
function handleDownload() {
    const t = getCurrentTranslations();
    if (!lastTranslatedTextForCopy) {
        showToast(t.errorNoDownloadText, "error");
        return;
    }

    const extension = lastOriginalFileTypeForDownload;
    const customName = DOM.filenameInput ? DOM.filenameInput.value.trim() : '';
    let outputFilename;

    if (customName) {
        outputFilename = sanitizeFilename(customName, extension, `SubMovies-translated.${extension}`);
    } else {
        // ✅ منطق قدیمی برای ساخت نام فایل به‌صورت خودکار
        const inputFileName = getOriginalFileName();
        if (inputFileName) {
            // اگر فایلی آپلود شده بود، پیشوند اضافه می‌شود
            outputFilename = `SubMovies-${inputFileName}`;
        } else {
            // اگر متنی پیست شده بود و فایلی در کار نبود
            outputFilename = `SubMovies-translated.${extension}`;
        }
    }

    downloadTextAsFile(lastTranslatedTextForCopy, outputFilename);
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

// Function to show chunk-based progress
export function showProgressMessage(t, current, total) {
    if (DOM.responseBox) {
        const progressText = (t.translatingProgress || "Translating block {current} of {total}...")
            .replace('{current}', current)
            .replace('{total}', total);

        DOM.responseBox.innerHTML = `<div class="translating-placeholder">${progressText}</div>`;
        DOM.responseSection.style.display = 'block';
    }
}

/**
 * Updates the persistent progress bar (percentage fill + "X of Y" caption).
 * @param {number} current - number of chunks completed so far (0-based index of the one in progress is fine too).
 * @param {number} total - total number of chunks.
 * @param {object} t - current translations object.
 */
export function updateProgressBar(current, total, t) {
    if (!DOM.progressBarContainer) return;
    DOM.progressBarContainer.style.display = 'block';
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    if (DOM.progressBarFill) DOM.progressBarFill.style.width = percent + '%';
    if (DOM.progressBarText) {
        const label = (t.translatingProgress || "Translating block {current} of {total}...")
            .replace('{current}', current)
            .replace('{total}', total);
        DOM.progressBarText.textContent = `${label} (${percent}%)`;
    }
}

/**
 * Hides the progress bar entirely (e.g. once a translation fully completes).
 */
export function hideProgressBar() {
    if (DOM.progressBarContainer) DOM.progressBarContainer.style.display = 'none';
    if (DOM.progressBarFill) DOM.progressBarFill.style.width = '0%';
    if (DOM.progressBarText) DOM.progressBarText.textContent = '';
}
