// src/js/ui/domElements.js

// Main Application Elements
export const appTitleH1 = document.getElementById('appTitleH1');
// ✅ FIX: The following element IDs do not exist in the current index.html.
// They are commented out to prevent null reference errors.
// export const langSelect = document.getElementById('langSelect');
// export const themeToggleBtn = document.getElementById('themeToggleBtn');


// Settings Card Elements
export const apiKeyInput = document.getElementById('apiKeyInput');
export const saveApiKeyCheckbox = document.getElementById('saveApiKeyCheckbox');
export const modelSelect = document.getElementById('modelSelect');
export const temperatureInput = document.getElementById('temperatureInput');
export const temperatureValueDisplay = document.getElementById('temperatureValueDisplay');
export const toneSelect = document.getElementById('toneSelect');
export const langTargetSelect = document.getElementById('langTargetSelect');

// File Input Elements
export const fileInput = document.getElementById('fileInput');
// ✅ FIX: This element ID does not exist in index.html.
// The logic for file input does not depend on this specific element anymore.
// export const fileInputLabelEl = document.getElementById('fileInputLabelEl');
export const fileNameText = document.getElementById("fileNameText");

// Prompt & Action Elements
export const promptInput = document.getElementById('promptInput');
export const charCountDisplay = document.getElementById('charCountDisplay');
export const filenameInput = document.getElementById('filenameInput');
export const translateBtn = document.getElementById('translateBtn');

// Response Section Elements
export const responseSection = document.getElementById('responseSection');
export const responseTitle = document.getElementById('responseTitle');
export const responseBox = document.getElementById('responseBox');
export const copyTranslatedBtn = document.getElementById('copyTranslatedBtn');
export const downloadBtn = document.getElementById('downloadBtn');

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
//    fileInputLabelEl, // Removed from group
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
