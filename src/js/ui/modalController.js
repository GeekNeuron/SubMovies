// src/js/ui/modalController.js
import * as DOM from './domElements.js';

let onSelectCallback = null;

/**
 * Initializes the modal, attaching event listeners for closing it.
 */
export function initializeModal() {
    if (!DOM.modal) return;
    DOM.modalCloseBtn.addEventListener('click', closeModal);
    DOM.modal.addEventListener('click', (event) => {
        // Close modal if the overlay (background) is clicked, but not the content inside it
        if (event.target === DOM.modal) {
            closeModal();
        }
    });
    // Add keyboard support to close with Escape key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && DOM.modal.style.display !== 'none') {
            closeModal();
        }
    });
}

/**
 * Opens the modal with a specific title and set of options.
 * @param {string} title - The title to display in the modal header.
 * @param {Array<object>} options - An array of option objects, e.g., [{value: 'val1', text: 'Text 1'}].
 * @param {string} currentSelectedValue - The value of the currently selected option to highlight it.
 * @param {Function} callback - The function to call when an option is selected. It receives the selected value.
 */
export function openModal(title, options, currentSelectedValue, callback) {
    if (!DOM.modal) return;
    
    // Set title
    DOM.modalTitle.textContent = title;
    
    // Set callback
    onSelectCallback = callback;

    // Clear previous options
    DOM.modalOptionsContainer.innerHTML = '';

    // Populate new options
    options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'modal-option';
        optionEl.textContent = option.text;
        optionEl.dataset.value = option.value;
        
        if (option.value === currentSelectedValue) {
            optionEl.classList.add('selected');
        }

        optionEl.addEventListener('click', () => {
            handleOptionSelect(option.value);
        });

        DOM.modalOptionsContainer.appendChild(optionEl);
    });
    
    // Show the modal
    DOM.modal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

/**
 * Closes the modal and cleans up.
 */
export function closeModal() {
    if (!DOM.modal) return;
    DOM.modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    onSelectCallback = null; // Clear callback
}

/**
 * Handles the logic when a user clicks on an option in the modal.
 * @param {string} selectedValue - The value of the clicked option.
 */
function handleOptionSelect(selectedValue) {
    if (onSelectCallback) {
        onSelectCallback(selectedValue);
    }
    closeModal();
}
