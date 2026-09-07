// src/js/core/toastService.js
import { getCurrentTranslations } from './i18nService.js'; // For localized close button ARIA label

/**
 * Displays a toast notification.
 * @param {string} msg - The message to display.
 * @param {string} [type='info'] - The type of toast ('info', 'error', 'success', 'warn').
 * @param {number} [duration=8000] - Duration in milliseconds before auto-hiding.
 */
export function showToast(msg, type = 'info', duration = 8000) {
    const t = getCurrentTranslations(); // Get current language translations
    const box = document.createElement('div');

    const typeClass = ['error', 'success', 'warn'].includes(type) ? `toast-${type}` : 'toast-info';
    box.className = `toast ${typeClass}`;

    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = msg;

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;'; // Multiplication sign as close icon
    closeButton.setAttribute('aria-label', t.closeBtnLabel || 'Close');

    closeButton.addEventListener('click', () => {
        box.classList.remove('toast-visible');
        setTimeout(() => box.remove(), 300); // Remove after transition
    });

    box.appendChild(messageSpan);
    box.appendChild(closeButton);
    document.body.appendChild(box);

    // Trigger fade-in and slide-up animation
    requestAnimationFrame(() => {
        box.classList.add('toast-visible');
    });

    // Auto-hide after duration
    setTimeout(() => {
        if (box.parentNode) { // Check if it hasn't been removed by user click
            closeButton.click(); // Trigger the same close logic for animation
        }
    }, duration);
}
