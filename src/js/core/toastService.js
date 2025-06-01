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

    let bgColorClass = 'bg-blue-500'; // Default for info (Tailwind class)
    // These colors should align with your CSS variables or Tailwind palette
    switch (type) {
        case 'error':
            bgColorClass = 'bg-red-600'; // Corresponds to --danger-color logic
            break;
        case 'success':
            bgColorClass = 'bg-green-500'; // Corresponds to --success-color logic
            break;
        case 'warn':
            bgColorClass = 'bg-yellow-500'; // Corresponds to --warning-color logic
            break;
        // 'info' uses the default bgColorClass
    }

    // Base classes for positioning and common styling
    box.className = `fixed top-5 left-1/2 transform -translate-x-1/2 ${bgColorClass} text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center max-w-lg text-sm transition-all duration-300 ease-out opacity-0 translate-y-[-20px]`;
    
    const messageSpan = document.createElement('span');
    messageSpan.style.wordBreak = 'break-word'; 
    messageSpan.textContent = msg;
    
    const closeButton = document.createElement('button');
    let closeBtnClass = 'ml-4 mr-0 text-white font-bold text-xl flex-shrink-0 opacity-70 hover:opacity-100 focus:outline-none'; 
    if (document.documentElement.dir === 'rtl') {
      closeBtnClass = 'mr-4 ml-0 text-white font-bold text-xl flex-shrink-0 opacity-70 hover:opacity-100 focus:outline-none';
    }
    closeButton.className = closeBtnClass;
    closeButton.innerHTML = '&times;'; // Multiplication sign as close icon
    closeButton.setAttribute('aria-label', t.closeBtnLabel || 'Close'); 
    
    closeButton.addEventListener('click', () => {
        box.style.opacity = '0';
        box.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => box.remove(), 300); // Remove after transition
    });
    
    box.appendChild(messageSpan);
    box.appendChild(closeButton);
    document.body.appendChild(box);

    // Trigger fade-in and slide-down animation
    requestAnimationFrame(() => {
        box.style.opacity = '1';
        box.style.transform = 'translate(-50%, 0)';
    });
    
    // Auto-hide after duration
    setTimeout(() => {
        if (box.parentNode) { // Check if it hasn't been removed by user click
            closeButton.click(); // Trigger the same close logic for animation
        }
    }, duration);
}
