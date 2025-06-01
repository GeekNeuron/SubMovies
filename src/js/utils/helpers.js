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
 * Throttles a function, ensuring it's executed at most once in a specified time period.
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The time limit in milliseconds.
 * @returns {Function} The throttled function.
 */
export function throttle(func, limit) {
    let inThrottle;
    let lastResult;
    return function(...args) {
        if (!inThrottle) {
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
            lastResult = func.apply(this, args);
        }
        return lastResult;
    };
}

/**
 * Sanitizes HTML string to prevent XSS by escaping special characters.
 * A more robust solution would use a dedicated library if complex HTML is involved.
 * This is a very basic sanitizer.
 * @param {string} str - The string to sanitize.
 * @returns {string} The sanitized string.
 */
export function sanitizeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Generates a simple unique ID.
 * Not cryptographically secure, just for basic unique element IDs if needed.
 * @param {string} [prefix='id-'] - A prefix for the ID.
 * @returns {string} A unique ID string.
 */
export function simpleUID(prefix = 'id-') {
    return prefix + Math.random().toString(36).substring(2, 9);
}

// Add other general utility functions here as your project grows.
// For example:
// - Date formatting functions
// - String manipulation helpers (capitalize, truncate, etc.)
// - Validation functions (email, URL, etc.) if needed beyond subtitle parsing
