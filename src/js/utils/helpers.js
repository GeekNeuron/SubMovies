// src/js/utils/helpers.js

/**
 * Debounces a function, delaying its execution until after a certain time has passed
 * since the last time it was invoked.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Triggers a browser download of the given text as a file.
 * @param {string} text - The file content.
 * @param {string} filename - The suggested filename.
 */
export function downloadTextAsFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
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
 * Sanitizes a user-provided filename (strips path/invalid characters and any
 * existing extension) and appends the given extension.
 * @param {string} rawName
 * @param {string} extension - without the leading dot, e.g. 'srt'.
 * @param {string} fallback - filename (including extension) to use if rawName is empty/blank after sanitizing.
 * @returns {string}
 */
export function sanitizeFilename(rawName, extension, fallback) {
    const sanitized = (rawName || '').trim()
        .replace(/[\\/:*?"<>|]+/g, '')
        .replace(/\.[a-zA-Z0-9]{1,5}$/, '');
    return sanitized ? `${sanitized}.${extension}` : fallback;
}

// Note: this file previously also exported `throttle`, `sanitizeHTML`, and
// `simpleUID`. They were removed (2026-09) because nothing in the codebase
// used them: there's no scroll/resize handler to throttle, all
// user-controlled text is already inserted via `.textContent` (never
// `.innerHTML`) so there was nothing for a manual sanitizer to protect, and
// no code generates dynamic element IDs. Add utilities back here only when
// something in the app actually needs them.
