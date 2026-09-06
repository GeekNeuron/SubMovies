// src/js/main.js
console.log("main.js: Script loaded."); // DEBUG

import * as DOM from './ui/domElements.js';
import { initializeTheme, applyThemeOnLoad, attachThemeToggleToTitle } from './core/themeService.js';
import { initializeI18n, getCurrentTranslations } from './core/i18nService.js';
import { initializeSettings, getSettings } from './ui/settingsController.js';
import { initializeFileHandling } from './ui/fileController.js';
import {
    initializeTranslationProcess, displayTranslationResult, clearResponseArea,
    showProgressMessage, updateProgressBar, hideProgressBar
} from './ui/translationController.js';
import { initializeModal } from './ui/modalController.js';
import { initializeManualEditor } from './ui/manualEditorController.js';
import { sendTranslationRequest } from './core/apiService.js';
import { showToast } from './core/toastService.js';
import {
    vttToInternalSrt, internalSrtToVTT, fixNumbers, parseSubtitleBlocks,
    isValidASS, parseASS, rebuildASS, assEventsToInternalSrt, postProcessLineWrapping
} from './core/subtitleParser.js';
import { getLanguageInfo } from './utils/languages.js';
import { APP_VERSION, POST_PROCESS_MAX_CHARS_PER_LINE } from './utils/constants.js';

// --- Translation session state ---
// Supports pausing (Stop button or an API error) and resuming a translation
// without losing chunks that already completed successfully.
// Shape: { originalInputText, originalFileType, targetLangForPrompt,
//          chunks: [{ text, translated, continuityNote }], assMeta? }
let session = null;
let abortController = null;

/**
 * Pauses for `ms` milliseconds, but resolves immediately if the given
 * AbortSignal fires - so Stop never has to wait out a pending rate-limit delay.
 */
function abortableDelay(ms, signal) {
    if (!ms || ms <= 0) return Promise.resolve();
    return new Promise((resolve) => {
        if (signal?.aborted) return resolve();
        const timeoutId = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                resolve();
            }, { once: true });
        }
    });
}

function buildChunks(inputText, chunkSize) {
    const subtitleBlocks = inputText.trim().split(/\n\s*\n/);
    const chunks = [];
    for (let i = 0; i < subtitleBlocks.length; i += chunkSize) {
        chunks.push({
            text: subtitleBlocks.slice(i, i + chunkSize).join('\n\n'),
            translated: null,
            continuityNote: '',
        });
    }
    return chunks;
}

/**
 * Reuses the existing session if it was built from the exact same input text
 * (this is what makes "Resume" possible); otherwise starts a fresh one.
 * Detects SRT / VTT / ASS-SSA format. For ASS, only the dialogue Text field
 * of each event is extracted and fed through the exact same SRT-based
 * chunking/translation/resume/continuity pipeline (via a placeholder-timestamp
 * internal representation) - the original styling/timing/effects are kept
 * completely untouched and re-merged back in at the end via rebuildASS().
 */
function getOrCreateSession(settings) {
    if (session && session.originalInputText === settings.originalInputText) {
        return session;
    }

    const trimmedInput = settings.inputText.trim();
    let originalFileType = 'srt';
    let assMeta = null;
    let textForChunking = settings.inputText;

    if (isValidASS(trimmedInput)) {
        originalFileType = 'ass';
        assMeta = parseASS(settings.inputText);
        textForChunking = assEventsToInternalSrt(assMeta);
    } else if (trimmedInput.startsWith("WEBVTT")) {
        originalFileType = 'vtt';
    }

    const targetLangInfo = getLanguageInfo(settings.targetLang);
    const targetLangForPrompt = targetLangInfo ? targetLangInfo.englishName : settings.targetLang;

    session = {
        originalInputText: settings.originalInputText,
        originalFileType,
        targetLangForPrompt,
        assMeta,
        chunks: buildChunks(textForChunking, settings.chunkSize),
    };
    return session;
}

function firstPendingIndex(s) {
    return s.chunks.findIndex(c => c.translated === null);
}

function hasPartialProgress(s) {
    if (!s) return false;
    const hasDone = s.chunks.some(c => c.translated !== null);
    const hasPending = s.chunks.some(c => c.translated === null);
    return hasDone && hasPending;
}

/**
 * Updates the main translate button's label: shows "Resume Translation" if
 * there's a paused session matching the currently-loaded subtitle text,
 * otherwise the normal "Translate Subtitles" label. Also called after a UI
 * language switch (via the window hook below) so the label re-translates.
 */
function updateTranslateButtonLabel() {
    if (!DOM.translateBtn) return;
    const t = getCurrentTranslations();
    const currentText = DOM.promptInput ? DOM.promptInput.value : '';
    const resumable = session && session.originalInputText === currentText && hasPartialProgress(session);
    DOM.translateBtn.textContent = resumable ? (t.resumeBtn || 'Resume Translation') : (t.translateBtn || 'Translate Subtitles');
}
window.refreshTranslateButtonLabelGlobal = updateTranslateButtonLabel;

/**
 * Builds a short "source -> translation" reference from the tail of a
 * just-completed chunk. Passed to the NEXT chunk's request as continuity
 * context so character names/terminology/tone stay consistent across the
 * whole file instead of drifting between independently-translated chunks.
 */
function buildContinuityNote(originalChunkText, translatedChunkText) {
    try {
        const origBlocks = parseSubtitleBlocks(originalChunkText);
        const transBlocks = parseSubtitleBlocks(translatedChunkText);
        const n = Math.min(2, origBlocks.length, transBlocks.length);
        if (n === 0) return '';
        const oTail = origBlocks.slice(-n);
        const tTail = transBlocks.slice(-n);
        return oTail
            .map((b, idx) => `"${b.originalText.replace(/\s+/g, ' ')}" -> "${(tTail[idx]?.originalText || '').replace(/\s+/g, ' ')}"`)
            .join('\n');
    } catch (e) {
        return '';
    }
}

/**
 * Builds the finalized output text from however many chunks have been
 * successfully translated so far. Since chunks are always processed
 * strictly in order and the loop stops at the first failure, "done" chunks
 * are always a contiguous prefix - there are never gaps to worry about.
 * Called after every completed chunk (for a live-updating preview) and
 * again at the end/on interruption.
 */
function buildOutputFromSession(s, postProcessEnabled) {
    const doneChunks = [];
    for (const c of s.chunks) {
        if (c.translated === null) break;
        doneChunks.push(c);
    }
    const doneCount = doneChunks.length;
    const translatedJoined = doneChunks.map(c => c.translated).join('\n\n');

    if (s.originalFileType === 'ass') {
        // Rebuild a real ASS file: translated events so far, original text
        // for any not-yet-translated ones (so a partial download is still valid).
        const translatedBlocks = parseSubtitleBlocks(translatedJoined);
        const translatedTexts = translatedBlocks.map(b => b.originalText);
        const finalOutput = rebuildASS(s.assMeta, translatedTexts);
        // Display-friendly "original" column: real dialogue text, no placeholder timestamps.
        const originalJoined = s.assMeta.events
            .slice(0, doneCount)
            .map((ev, i) => `${i + 1}\n${ev.originalText}`)
            .join('\n\n');
        return { finalOutput, originalJoined, doneCount };
    }

    const originalJoined = doneChunks.map(c => c.text).join('\n\n');
    let finalOutput = fixNumbers(translatedJoined.trim());
    if (postProcessEnabled) {
        finalOutput = postProcessLineWrapping(finalOutput, POST_PROCESS_MAX_CHARS_PER_LINE);
    }
    if (s.originalFileType === 'vtt') {
        finalOutput = internalSrtToVTT(finalOutput);
    }
    return { finalOutput, originalJoined, doneCount };
}

/**
 * Runs (or resumes) the translation for the current session, one chunk at a
 * time. On Stop or an API error, whatever chunks already succeeded are kept
 * and displayed/downloadable - nothing already paid for in API calls is
 * ever discarded - and the translate button switches to "Resume" so the
 * user can continue exactly where it left off. The comparison view updates
 * live after every chunk, not just at the very end.
 */
async function runTranslation() {
    const settings = getSettings();
    const t = getCurrentTranslations();

    const s = getOrCreateSession(settings);
    const startIndex = firstPendingIndex(s);
    if (startIndex === -1) {
        const { finalOutput, originalJoined } = buildOutputFromSession(s, settings.postProcessEnabled);
        displayTranslationResult(originalJoined, finalOutput, s.originalFileType, t);
        return;
    }

    DOM.translateBtn.style.display = 'none';
    DOM.stopBtn.style.display = 'block';
    abortController = new AbortController();
    showProgressMessage(t, startIndex + 1, s.chunks.length);
    updateProgressBar(startIndex, s.chunks.length, t);

    let stoppedEarly = false;

    try {
        for (let i = startIndex; i < s.chunks.length; i++) {
            if (abortController.signal.aborted) {
                stoppedEarly = true;
                showToast(t.translationCancelled, 'warning');
                break;
            }

            // Rate limiting: wait between consecutive requests within this
            // run (never before the very first one), so large files are
            // less likely to hit the provider's rate limit.
            if (i > startIndex && settings.rateLimitDelay > 0) {
                await abortableDelay(settings.rateLimitDelay * 1000, abortController.signal);
                if (abortController.signal.aborted) {
                    stoppedEarly = true;
                    showToast(t.translationCancelled, 'warning');
                    break;
                }
            }

            const chunkText = s.chunks[i].text;
            let processedChunkText = chunkText;
            // For VTT, each chunk must be treated as a mini-file for parsing.
            // (ASS chunks are already plain placeholder-timestamp SRT blocks
            // by this point, built in getOrCreateSession, so no extra
            // conversion is needed for them here.)
            if (s.originalFileType === 'vtt' && chunkText) {
                try {
                    processedChunkText = vttToInternalSrt("WEBVTT\n\n" + chunkText);
                } catch (e) {
                    console.warn("Could not parse VTT chunk, sending as is.", e);
                    processedChunkText = chunkText;
                }
            }

            const continuityContext = i > 0 ? (s.chunks[i - 1].continuityNote || '') : '';

            const rawTranslation = await sendTranslationRequest(
                processedChunkText,
                settings.apiKey,
                settings.model,
                settings.tone,
                s.targetLangForPrompt,
                settings.customPrompt,
                continuityContext,
                settings.temperature,
                abortController.signal
            );

            s.chunks[i].translated = rawTranslation || '';
            s.chunks[i].continuityNote = buildContinuityNote(processedChunkText, rawTranslation || '');
            updateProgressBar(i + 1, s.chunks.length, t);

            // Live preview: refresh the comparison view after every chunk,
            // not just once the whole run finishes or stops.
            const liveResult = buildOutputFromSession(s, settings.postProcessEnabled);
            displayTranslationResult(liveResult.originalJoined, liveResult.finalOutput, s.originalFileType, t);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            stoppedEarly = true;
            console.log('Fetch aborted by user.');
        } else {
            console.error("Translation process failed:", error);
            const errorMessageText = (t.errorAPI || "API Error: {message}").replace('{message}', error.message);
            showToast(errorMessageText, 'error');
            stoppedEarly = true;
        }
    }

    // --- Finalize: show whatever has been successfully translated so far.
    // Unlike before, a failure or Stop never wipes out chunks that already
    // succeeded - the response area always reflects real progress.
    const { finalOutput, originalJoined, doneCount } = buildOutputFromSession(s, settings.postProcessEnabled);
    if (doneCount > 0) {
        displayTranslationResult(originalJoined, finalOutput, s.originalFileType, t);
    } else {
        clearResponseArea();
    }

    if (doneCount === s.chunks.length) {
        hideProgressBar();
        session = null; // Fully complete - nothing left to resume.
    } else if (stoppedEarly && doneCount > 0) {
        const msg = (t.partialTranslationSaved || '{current} of {total} parts translated.')
            .replace('{current}', doneCount).replace('{total}', s.chunks.length);
        showToast(msg, 'warning');
    }

    DOM.translateBtn.style.display = 'block';
    DOM.stopBtn.style.display = 'none';
    abortController = null;
    updateTranslateButtonLabel();
}

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
    initializeManualEditor();
    console.log("main.js: Manual translation editor initialized."); // DEBUG

    if (DOM.translateBtn && DOM.stopBtn) {
        DOM.translateBtn.addEventListener('click', async () => {
            const settings = getSettings();
            const t = getCurrentTranslations();

            if (!settings.apiKey || !settings.inputText) {
                return showToast(t.errorMissing, 'error');
            }
            await runTranslation();
        });

        DOM.stopBtn.addEventListener('click', () => {
            if (abortController) {
                abortController.abort();
                console.log("Stop button clicked, aborting translation.");
            }
        });
    }

    if (DOM.promptInput) {
        DOM.promptInput.addEventListener('input', updateTranslateButtonLabel);
    }
    updateTranslateButtonLabel();

    const appVersionText = document.getElementById('appVersionText');
    if (appVersionText) appVersionText.textContent = `v${APP_VERSION}`;

    console.log("main.js: mainApp() finishing initializations."); // DEBUG
    console.log("SubMovies Application Initialized with logging!"); // DEBUG
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js: DOMContentLoaded event fired."); // DEBUG
    mainApp().catch(err => {
        console.error("main.js: Error during mainApp execution:", err);
    });
});
