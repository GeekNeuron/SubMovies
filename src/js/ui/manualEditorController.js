// src/js/ui/manualEditorController.js
import * as DOM from './domElements.js';
import { getCurrentTranslations } from '../core/i18nService.js';
import { parseSubtitleBlocks, isValidASS, parseASS, rebuildASS } from '../core/subtitleParser.js';
import { debounce, downloadTextAsFile, sanitizeFilename } from '../utils/helpers.js';
import { LS_MANUAL_MODE_ENABLED, LS_MANUAL_ORIGINAL_TEXT, LS_MANUAL_TRANSLATIONS } from '../utils/constants.js';

let currentBlocks = [];       // [{index, timestamp, originalText}]
let currentTranslations = []; // string[], same length/order as currentBlocks
let trackedOriginalText = ''; // the promptInput text the editor was last built from
let currentAssMeta = null;    // set when the loaded content is ASS/SSA, used to rebuild a real .ass on download

const debouncedPersist = debounce(persistTranslations, 200);

/**
 * Sets up the manual translation mode: the enable/disable toggle, reacting
 * to subtitle content changes (typing, pasting, or file upload), and the
 * clean download button. Also restores any in-progress manual session from
 * localStorage (toggle state, original text, and every translated line) so
 * a page reload never loses the user's work.
 */
export function initializeManualEditor() {
    if (DOM.manualModeToggle) {
        DOM.manualModeToggle.addEventListener('change', handleToggleChange);
    }
    if (DOM.promptInput) {
        DOM.promptInput.addEventListener('input', handlePromptInputChanged);
    }
    if (DOM.manualDownloadBtn) {
        DOM.manualDownloadBtn.addEventListener('click', handleManualDownload);
    }

    const enabled = localStorage.getItem(LS_MANUAL_MODE_ENABLED) === 'true';
    if (DOM.manualModeToggle) DOM.manualModeToggle.checked = enabled;
    applyModeVisibility(enabled);
    if (enabled) {
        restoreFromStorage();
    }
}

function applyModeVisibility(enabled) {
    if (DOM.aiSettingsSection) DOM.aiSettingsSection.style.display = enabled ? 'none' : '';
    if (DOM.translateBtn) DOM.translateBtn.style.display = enabled ? 'none' : '';
    if (DOM.manualEditorSection) DOM.manualEditorSection.style.display = enabled ? 'block' : 'none';
}

function handleToggleChange() {
    const enabled = DOM.manualModeToggle.checked;
    localStorage.setItem(LS_MANUAL_MODE_ENABLED, enabled ? 'true' : 'false');
    applyModeVisibility(enabled);
    if (enabled) {
        restoreFromStorage();
    }
}

/**
 * Decides how to (re)build the editor when manual mode turns on:
 * - If the textarea currently matches the last-saved original text, restore
 *   the saved translations (this is the "reload the page" / "just toggled
 *   back on" case).
 * - If the textarea is empty but we have a saved session, restore BOTH the
 *   original text and the translations (this is the "fresh page load with
 *   manual mode already on" case).
 * - Otherwise (new/different content loaded), start a fresh, empty session.
 */
function restoreFromStorage() {
    const savedOriginal = localStorage.getItem(LS_MANUAL_ORIGINAL_TEXT) || '';
    const currentInput = DOM.promptInput ? DOM.promptInput.value : '';

    if (currentInput.trim() && currentInput === savedOriginal) {
        buildEditor(currentInput, readSavedTranslations());
    } else if (currentInput.trim()) {
        buildEditor(currentInput, []);
    } else if (savedOriginal.trim()) {
        if (DOM.promptInput) DOM.promptInput.value = savedOriginal;
        buildEditor(savedOriginal, readSavedTranslations());
        if (DOM.promptInput) {
            // Let other modules (char count, etc.) know the textarea changed.
            DOM.promptInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        buildEditor('', []);
    }
}

function readSavedTranslations() {
    try {
        return JSON.parse(localStorage.getItem(LS_MANUAL_TRANSLATIONS) || '[]');
    } catch (e) {
        return [];
    }
}

function handlePromptInputChanged() {
    if (!DOM.manualModeToggle || !DOM.manualModeToggle.checked) return;
    const text = DOM.promptInput.value;
    if (text === trackedOriginalText) return; // Already reflected (e.g. our own restore dispatch).
    buildEditor(text, []);
}

/**
 * Parses the loaded text into editable rows. Detects ASS/SSA and, if found,
 * extracts only the dialogue text per event (real ASS timing/styling is
 * preserved untouched and re-merged back in on download via rebuildASS()).
 * For SRT/VTT, uses the shared block parser as before.
 */
function buildEditor(text, initialTranslations) {
    trackedOriginalText = text;

    const trimmed = text.trim();
    if (isValidASS(trimmed)) {
        currentAssMeta = parseASS(text);
        currentBlocks = currentAssMeta.events.map((ev, i) => ({
            index: String(i + 1),
            timestamp: '', // real ASS timing isn't meaningful to show per-row here; preserved on rebuild
            originalText: ev.originalText,
        }));
    } else {
        currentAssMeta = null;
        currentBlocks = parseSubtitleBlocks(text);
    }

    currentTranslations = currentBlocks.map((_, i) => initialTranslations[i] || '');
    persistTranslations();
    renderRows();
}

function renderRows() {
    if (!DOM.manualEditorRows) return;
    const t = getCurrentTranslations();

    DOM.manualEditorRows.innerHTML = ''; // Safe: we only ever insert nodes built via createElement/textContent below.

    if (DOM.manualEditorEmptyHint) {
        DOM.manualEditorEmptyHint.style.display = currentBlocks.length === 0 ? 'block' : 'none';
    }
    if (DOM.manualDownloadBtn) {
        DOM.manualDownloadBtn.style.display = currentBlocks.length > 0 ? 'block' : 'none';
    }

    const fragment = document.createDocumentFragment();

    currentBlocks.forEach((block, i) => {
        const row = document.createElement('div');
        row.className = 'manual-row';

        const metaText = currentAssMeta ? `#${block.index}` : `${block.index} · ${block.timestamp}`;

        const leftCol = document.createElement('div');
        const leftMeta = document.createElement('div');
        leftMeta.className = 'manual-row-meta';
        leftMeta.textContent = metaText;
        const leftText = document.createElement('div');
        leftText.className = 'manual-row-original';
        leftText.textContent = block.originalText;
        leftCol.appendChild(leftMeta);
        leftCol.appendChild(leftText);

        const rightCol = document.createElement('div');
        const rightMeta = document.createElement('div');
        rightMeta.className = 'manual-row-meta';
        rightMeta.textContent = metaText;
        const textarea = document.createElement('textarea');
        textarea.className = 'manual-row-translation-input';
        textarea.placeholder = t.manualTranslationPlaceholder || '';
        textarea.value = currentTranslations[i] || '';
        textarea.addEventListener('input', (e) => {
            currentTranslations[i] = e.target.value;
            debouncedPersist();
        });
        rightCol.appendChild(rightMeta);
        rightCol.appendChild(textarea);

        row.appendChild(leftCol);
        row.appendChild(rightCol);
        fragment.appendChild(row);
    });

    DOM.manualEditorRows.appendChild(fragment);
}

function persistTranslations() {
    localStorage.setItem(LS_MANUAL_ORIGINAL_TEXT, trackedOriginalText);
    localStorage.setItem(LS_MANUAL_TRANSLATIONS, JSON.stringify(currentTranslations));
}

function handleManualDownload() {
    if (currentBlocks.length === 0) return;

    const customName = DOM.filenameInput ? DOM.filenameInput.value.trim() : '';

    if (currentAssMeta) {
        const output = rebuildASS(currentAssMeta, currentTranslations);
        const filename = customName
            ? sanitizeFilename(customName, 'ass', 'SubMovies-manual-translation.ass')
            : 'SubMovies-manual-translation.ass';
        downloadTextAsFile(output, filename);
        return;
    }

    let srt = '';
    currentBlocks.forEach((block, i) => {
        srt += `${i + 1}\n${block.timestamp}\n${(currentTranslations[i] || '').trim()}\n\n`;
    });

    const filename = customName
        ? sanitizeFilename(customName, 'srt', 'SubMovies-manual-translation.srt')
        : 'SubMovies-manual-translation.srt';

    downloadTextAsFile(srt.trim() + '\n', filename);
}

/**
 * Called by i18nService after a UI language switch, so translated
 * placeholders (and the empty-state hint) refresh without losing any
 * typed content.
 */
export function refreshManualEditorTranslations() {
    if (DOM.manualModeToggle && DOM.manualModeToggle.checked) {
        renderRows();
    }
}
// Expose globally for i18nService to call after language change (same
// pattern used by fileController.js's window.updateCharCountGlobal).
window.refreshManualEditorTranslationsGlobal = refreshManualEditorTranslations;
