// src/js/ui/domElements.js

// Main Application Elements
export const appTitleH1 = document.getElementById('appTitleH1');
export const langSelect = document.getElementById('langSelect'); // Changed ID in HTML
export const themeToggleBtn = document.getElementById('themeToggleBtn');

// Settings Card Elements
export const apiKeyInput = document.getElementById('apiKeyInput'); // Changed ID in HTML
export const saveApiKeyCheckbox = document.getElementById('saveApiKeyCheckbox');
export const modelSelect = document.getElementById('modelSelect'); // Changed ID in HTML
export const temperatureInput = document.getElementById('temperatureInput'); // Changed ID in HTML
export const temperatureValueDisplay = document.getElementById('temperatureValueDisplay');
export const toneSelect = document.getElementById('toneSelect'); // Changed ID in HTML
export const langTargetSelect = document.getElementById('langTargetSelect'); // Changed ID in HTML

// File Input Elements
export const fileInput = document.getElementById('fileInput');
export const fileInputLabelEl = document.getElementById('fileInputLabelEl'); // Changed ID in HTML
export const fileNameText = document.getElementById("fileNameText");

// Prompt & Action Elements
export const promptInput = document.getElementById('promptInput'); // Changed ID in HTML
export const charCountDisplay = document.getElementById('charCountDisplay');
export const filenameInput = document.getElementById('filenameInput');
export const translateBtn = document.getElementById('translateBtn'); // Changed ID in HTML

// Response Section Elements
export const responseSection = document.getElementById('responseSection');
export const responseTitle = document.getElementById('responseTitle');
export const responseBox = document.getElementById('responseBox'); // Changed ID in HTML
export const copyTranslatedBtn = document.getElementById('copyTranslatedBtn');
export const downloadBtn = document.getElementById('downloadBtn');

// Footer (if needed for dynamic updates, though less common)
// export const footerElement = document.querySelector('footer');

// You can also export groups of elements if that's more convenient
export const settingsElements = {
    apiKeyInput,
    saveApiKeyCheckbox,
    modelSelect,
    temperatureInput,
    temperatureValueDisplay,
    toneSelect,
    langTargetSelect,
};

export const fileElements = {
    fileInput,
    fileInputLabelEl,
    fileNameText,
    promptInput,
    charCountDisplay,
};

export const actionElements = {
    filenameInput,
    translateBtn,
};

export const outputElements = {
    responseSection,
    responseTitle,
    responseBox,
    copyTranslatedBtn,
    downloadBtn,
};

