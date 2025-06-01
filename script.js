// --- DOM Element Selections ---
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyCheckbox = document.getElementById('saveApiKey');
const promptInput = document.getElementById('prompt');
const charCountDisplay = document.getElementById('charCount');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const responseSection = document.getElementById('responseSection'); // Changed from responseContainer
const responseTitle = document.getElementById('responseTitle');
const modelSelect = document.getElementById('model');
const temperatureInput = document.getElementById('temperature');
const temperatureValueDisplay = document.getElementById('temperatureValue');
const langSelect = document.getElementById('lang');
const toneSelect = document.getElementById('tone');
const fileInput = document.getElementById('fileInput');
const fileInputLabel = document.getElementById('fileInputLabel'); // Still useful for direct text update
const langTarget = document.getElementById('langTarget');
const filenameInput = document.getElementById('filenameInput');
const downloadBtn = document.getElementById('downloadBtn');
const copyTranslatedBtn = document.getElementById('copyTranslatedBtn');
const fileNameText = document.getElementById("fileNameText");
const themeToggleBtn = document.getElementById('themeToggleBtn');
const appTitleH1 = document.getElementById('appTitleH1');

// --- State Variables ---
const translations = {};
let currentLang = 'en'; 
let lastTranslatedText = "";
let originalFileType = 'srt'; // To track original file type for download
const allowedLangs = ['en', 'fa']; 
const CHAR_COUNT_WARNING_THRESHOLD = 15000; // Example threshold

// --- Initialization ---
async function initializeApp() {
    // 1. Theme
    const themeToApply = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(themeToApply);

    // 2. Load saved API Key
    if (localStorage.getItem('saveApiKey') === 'true') {
        apiKeyInput.value = localStorage.getItem('apiKey') || '';
        saveApiKeyCheckbox.checked = true;
    }

    // 3. Language
    let initialLang = localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';
    if (!allowedLangs.includes(initialLang)) {
        initialLang = 'en'; 
    }
    langSelect.value = initialLang;
    localStorage.setItem('lang', initialLang); 
    await loadLang(initialLang); 
    
    // 4. Update ARIA label for theme button (now that translations might be loaded)
    updateThemeToggleButtonAriaLabel(document.body.classList.contains('dark-theme'));

    // 5. Initial char count
    updateCharCount();
}

// --- THEME TOGGLE ---
function updateThemeToggleButtonAriaLabel(isDark) {
    const t = translations[currentLang] || {};
    const key = isDark ? 'themeToggleLight' : 'themeToggleDark';
    const fallbackText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    themeToggleBtn.setAttribute('aria-label', t[key] || fallbackText);
}

function applyTheme(theme) { 
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateThemeToggleButtonAriaLabel(theme === 'dark');
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const currentThemeIsDark = document.body.classList.contains('dark-theme');
  const newTheme = currentThemeIsDark ? 'light' : 'dark';
  applyTheme(newTheme);
});

// --- API Key Saving ---
saveApiKeyCheckbox.addEventListener('change', () => {
    if (saveApiKeyCheckbox.checked) {
        localStorage.setItem('apiKey', apiKeyInput.value);
        localStorage.setItem('saveApiKey', 'true');
    } else {
        localStorage.removeItem('apiKey');
        localStorage.setItem('saveApiKey', 'false');
    }
});
apiKeyInput.addEventListener('input', () => { // Update saved key if checkbox is checked
    if (saveApiKeyCheckbox.checked) {
        localStorage.setItem('apiKey', apiKeyInput.value);
    }
});


// --- LANGUAGE HANDLING ---
langSelect.addEventListener('change', (e) => {
  const lang = e.target.value;
  localStorage.setItem('lang', lang);
  loadLang(lang);
});

function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) {
    console.warn(`Translations for ${lang} not found. Trying English.`);
    if (lang !== 'en' && translations['en']) { applyTranslations('en'); }
    return;
  }
  currentLang = lang;
  document.documentElement.lang = lang; 
  document.documentElement.dir = (lang === 'fa') ? 'rtl' : 'ltr';
  if(document.getElementById('formContainer')) document.getElementById('formContainer').dir = (lang === 'fa') ? 'rtl' : 'ltr';


  document.title = t.appTitle || "SubMovies AI Translator";
  if(appTitleH1) appTitleH1.textContent = t.appTitleH1 || "SubMovies AI Translator";

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerText = t[key] !== undefined ? t[key] : (el.id === 'fileNameText' && key === 'fileNone' ? '' : el.innerText);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  
  if (apiKeyInput && t.apiKeyPlaceholder) apiKeyInput.placeholder = t.apiKeyPlaceholder;
  if (promptInput && t.promptPlaceholder) promptInput.placeholder = t.promptPlaceholder;
  if (filenameInput && t.filenamePlaceholder) filenameInput.placeholder = t.filenamePlaceholder;
  if (saveApiKeyCheckbox.labels[0] && t.saveApiKeyLabel) saveApiKeyCheckbox.labels[0].textContent = t.saveApiKeyLabel;


  if (downloadBtn && t.downloadBtn) downloadBtn.textContent = t.downloadBtn;
  if (copyTranslatedBtn && t.copyBtn) copyTranslatedBtn.childNodes[1].nodeValue = ` ${t.copyBtn}`; // Assuming icon then text
  if (fileInputLabel && t.fileChooseLabel) fileInputLabel.childNodes[1].nodeValue = ` ${t.fileChooseLabel}`; // Assuming icon then text
  
  const currentFile = fileInput.files[0];
  if (fileNameText) {
    fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
  }
  
  if (responseTitle && t.responseTitle) responseTitle.textContent = t.responseTitle;
  
  const translatingPlaceholderKey = 'translatingPlaceholder';
  if (responseBox && responseBox.textContent === (translations[currentLang]?.[translatingPlaceholderKey] || 'Translating... please wait.')) {
      responseBox.textContent = t[translatingPlaceholderKey] !== undefined ? t[translatingPlaceholderKey] : '...';
  }
  
  const tempTooltipKey = 'temperatureTooltip';
  const tempTooltipEl = document.querySelector(`[data-i18n="${tempTooltipKey}"]`);
  if (tempTooltipEl && t[tempTooltipKey]) tempTooltipEl.textContent = t[tempTooltipKey];
  
  updateThemeToggleButtonAriaLabel(document.body.classList.contains('dark-theme'));
  updateCharCount(); // Update char count label with new language

  if (t.tones && toneSelect) {
    const currentToneValue = toneSelect.value;
    toneSelect.innerHTML = "";
    let toneFound = false;
    t.tones.forEach(toneText => {
      const opt = document.createElement("option"); opt.textContent = toneText; opt.value = toneText; 
      if(toneText === currentToneValue) { opt.selected = true; toneFound = true; }
      toneSelect.appendChild(opt);
    });
    if(!toneFound && t.tones.length > 0) { toneSelect.value = t.tones[0];}
  }

  if (t.models && modelSelect) {
    Array.from(modelSelect.options).forEach(opt => {
        const modelKey = opt.value; 
        if (t.models[modelKey]) { opt.textContent = t.models[modelKey]; }
    });
  }
}

async function loadLang(lang) {
  try {
    const res = await fetch(`lang/${lang}.json?v=ui_revamp_1`); 
    if (!res.ok) throw new Error(`HTTP error ${res.status} for ${lang}.json`);
    const data = await res.json();
    translations[lang] = data;
    applyTranslations(lang);
  } catch (err) {
    console.error(`Error loading language file ${lang}:`, err);
    if (lang !== 'en') {
        showToast(`Could not load ${lang} translations. Using English.`, 'error');
        if (translations['en']) { applyTranslations('en'); langSelect.value = 'en'; } 
        else { await loadLang('en'); if (translations['en']) langSelect.value = 'en'; }
    } else if (!translations['en']) {
        document.body.innerHTML = "Critical error: English language file failed to load.";
    }
  }
}

// --- Character Count ---
promptInput.addEventListener('input', updateCharCount);
function updateCharCount() {
    const charLength = promptInput.value.length;
    const t = translations[currentLang] || {};
    charCountDisplay.textContent = (t.charCountLabel || "Characters: {count}").replace('{count}', charLength);
    if (charLength > CHAR_COUNT_WARNING_THRESHOLD) {
        charCountDisplay.style.color = 'var(--danger-color)'; // Use CSS variable for danger color
        showToast(t.charCountWarning || "Warning: Very long text.", 'warn'); // 'warn' type could be new for toast
    } else {
        charCountDisplay.style.color = 'var(--text-color-secondary)';
    }
}

// --- Temperature Slider ---
temperatureInput.addEventListener('input', (e) => {
    temperatureValueDisplay.textContent = e.target.value;
});


// --- SRT/VTT PARSING UTILITIES ---
function isValidSRT(text) {
    // Basic check: look for sequence number, timestamp arrow, and blank line
    return /^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}\s*\n/.test(text.trim());
}

function isValidVTT(text) {
    return text.trim().startsWith("WEBVTT");
}

// Converts VTT to a simplified SRT-like structure for internal processing
function vttToInternalSrt(vttText) {
    let lines = vttText.split(/\r?\n/);
    if (!lines[0].startsWith("WEBVTT")) {
        throw new Error("Missing WEBVTT header.");
    }
    lines = lines.slice(1).filter(line => !line.startsWith("NOTE") && !line.startsWith("STYLE") && line.trim() !== ""); // Remove header, notes, styles, empty lines

    let srtString = "";
    let counter = 1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("-->")) { // Timestamp line
            srtString += `${counter}\n`;
            srtString += `${lines[i].replace(/\./g, ',')}\n`; // VTT uses '.', SRT uses ',' for milliseconds
            i++;
            let textLines = [];
            while (i < lines.length && lines[i].trim() !== "") {
                textLines.push(lines[i]);
                i++;
            }
            srtString += textLines.join("\n") + "\n\n";
            counter++;
        }
    }
    return srtString.trim();
}

// Converts translated SRT-like text back to VTT if original was VTT
function internalSrtToVTT(srtText) {
    let vttString = "WEBVTT\n\n";
    const blocks = srtText.trim().split(/\n\s*\n/); // Split by blank lines, allowing for spaces
    blocks.forEach(block => {
        const lines = block.split('\n');
        if (lines.length >= 2) {
            // const sequence = lines[0]; // We don't need sequence for VTT
            const timestamps = lines[1].replace(/,/g, '.'); // SRT uses ',', VTT uses '.'
            const textContent = lines.slice(2).join('\n');
            vttString += `${timestamps}\n${textContent}\n\n`;
        }
    });
    return vttString.trim();
}


// --- API CALL & TRANSLATION LOGIC ---
sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  let rawText = promptInput.value.trim();
  const model = modelSelect.value;
  const temperature = parseFloat(temperatureInput.value);
  const tone = toneSelect?.value || "Neutral"; 
  const langOut = langTarget?.value || "en";
  const t = translations[currentLang] || {};

  if (!apiKey || !rawText) {
    return showToast(t.errorMissing || 'API Key and Subtitle Text are required.', 'error');
  }

  // File type detection and validation
  let isVTT = false;
  if (rawText.startsWith("WEBVTT")) {
      if (!isValidVTT(rawText)) return showToast(t.fileValidationVTTError || "Invalid VTT content.", 'error');
      try {
          rawText = vttToInternalSrt(rawText); // Convert VTT to internal SRT for processing
          isVTT = true;
          originalFileType = 'vtt';
      } catch (e) {
          return showToast(e.message, 'error');
      }
  } else if (!isValidSRT(rawText) && rawText.includes("-->")) { 
      // If it's not VTT but looks like it might be SRT but invalid
      return showToast(t.fileValidationSRTError || "Invalid SRT content. Check format.", 'error');
  } else {
      originalFileType = 'srt';
  }
  
  responseSection.style.display = 'block';
  responseTitle.style.display = 'block'; 
  responseBox.innerHTML = ''; 
  responseBox.textContent = t.translatingPlaceholder !== undefined ? t.translatingPlaceholder : 'Translating... please wait.'; 
  downloadBtn.style.display = 'none'; 
  copyTranslatedBtn.style.display = 'none';
  lastTranslatedText = "";

  const prompt = `Please translate the following subtitles (formatted like SRT) from their original language into ${langOut}.
Maintain the original SRT formatting (sequence numbers, timestamps like "00:00:20,123 --> 00:00:22,456", and line breaks) precisely.
Apply a ${tone} tone to the translated text portions only.
Ensure all numbers that are NOT part of SRT timestamps are also translated or appropriately localized for ${langOut}.
Do not add any extra explanations, comments, or text beyond the translated subtitle content itself.

Original Subtitles:
${rawText}`; // rawText is now always SRT-like

  try {
    const generationConfig = { temperature: temperature }; // Add temperature

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: generationConfig 
        })
    });

    const responseBodyText = await res.text(); 
    if (!res.ok) { /* ... (error handling from previous response) ... */ 
        let errorData;
        let errorMessage = `API request failed: ${res.status} ${res.statusText}.`;
        try {
            errorData = JSON.parse(responseBodyText);
            console.error('API Error Response (JSON):', errorData);
            errorMessage = errorData.error?.message || errorMessage;
            if (errorData.error?.details) {
                errorMessage += ` Details: ${JSON.stringify(errorData.error.details)}`;
            }
        } catch (e) {
            console.error('API Error Response (Non-JSON):', responseBodyText);
            if (responseBodyText) errorMessage += ` Response: ${responseBodyText.substring(0, 200)}`;
        }
        throw new Error(errorMessage);
    }
    const data = JSON.parse(responseBodyText); 

    if (data.promptFeedback && data.promptFeedback.blockReason) { /* ... */ 
        const blockDetails = data.promptFeedback.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || 'No further details.';
        throw new Error(`Prompt blocked by API: ${data.promptFeedback.blockReason}. Details: ${blockDetails}`);
    }
    const outputFromAPI = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!outputFromAPI) { /* ... */
        console.error('No content in API response structure:', data);
        const noContentMsg = t.errorAPI?.replace('{message}', 'No translation content received in API response structure.') || 'No translation content received.';
        throw new Error(noContentMsg);
    }
    
    let fixedOutput = fixNumbers(outputFromAPI);
    if (isVTT) { // If original was VTT, convert translated SRT-like text back to VTT
        fixedOutput = internalSrtToVTT(fixedOutput);
    }
    
    responseBox.innerHTML = ''; 
    responseBox.appendChild(renderCompare(promptInput.value, fixedOutput)); // Compare with original input (VTT or SRT)
    downloadBtn.style.display = "block";
    copyTranslatedBtn.style.display = "inline-block"; // Show copy button

  } catch (err) { /* ... (error handling from previous response, ensure 't' is defined) ... */
    console.error('Translation Error Details:', err);
    let displayMessage = err.message; 
    if (t.errorAPI && err.message && !err.message.toLowerCase().includes('api request failed') && !err.message.toLowerCase().includes('prompt blocked')) {
        displayMessage = t.errorAPI.replace('{message}', err.message);
    } else if (!err.message) { 
        displayMessage = t.errorUnknown || 'An unknown error occurred.';
    }
    responseBox.innerHTML = ''; 
    responseTitle.style.display = 'none'; 
    copyTranslatedBtn.style.display = 'none';
    showToast(displayMessage, 'error');
  }
});

// --- FILE HANDLING ---
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const t = translations[currentLang] || {};
  originalFileType = 'srt'; // Reset to default

  if (fileNameText) {
    fileNameText.textContent = file ? file.name : (t.fileNone !== undefined ? t.fileNone : '');
  }
  if (!file) {
    promptInput.value = ''; 
    updateCharCount();
    return;
  }

  if (file.name.toLowerCase().endsWith('.vtt')) {
      originalFileType = 'vtt';
  } else if (!file.name.toLowerCase().endsWith('.srt')) {
      showToast("Unsupported file type. Please upload .srt or .vtt", "error"); // Localize
      if (fileNameText) fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
      promptInput.value = '';
      updateCharCount();
      return;
  }

  try {
    const text = await file.text();
    promptInput.value = text;
    updateCharCount(); // Update char count after loading file
  } catch (err) {
    console.error("Error reading file:", err);
    const fileReadErrorMsg = (t.fileReadError || "Error reading file:") + " " + err.message;
    showToast(fileReadErrorMsg, 'error');
    promptInput.value = '';
    updateCharCount();
    if (fileNameText) fileNameText.textContent = t.fileNone !== undefined ? t.fileNone : '';
  }
});

// --- DOWNLOAD FUNCTIONALITY ---
downloadBtn.addEventListener('click', () => {
  const t = translations[currentLang] || {};
  if (!lastTranslatedText) {
    showToast(t.errorNoDownloadText || "No translated text to download.", "error");
    return;
  }
  let filename = filenameInput.value.trim();
  const extension = originalFileType; // 'srt' or 'vtt'

  if (!filename) {
    const originalBaseFileName = fileInput.files[0]?.name.replace(/\.(srt|vtt)$/i, '');
    const targetLangCode = langTarget.value || 'trans';
    filename = originalBaseFileName ? `${originalBaseFileName}_${targetLangCode}.${extension}` : `translated_subtitle_${targetLangCode}.${extension}`;
  } else if (!filename.toLowerCase().endsWith(`.${extension}`)) {
    filename = filename.replace(/\.(srt|vtt)$/i, ''); // Remove existing extension if wrong
    filename += `.${extension}`;
  }
  
  const blob = new Blob([lastTranslatedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
});

// --- COPY TO CLIPBOARD ---
copyTranslatedBtn.addEventListener('click', () => {
    const t = translations[currentLang] || {};
    if (!lastTranslatedText) {
        showToast(t.errorNoDownloadText || "No translated text to copy.", 'error');
        return;
    }
    navigator.clipboard.writeText(lastTranslatedText).then(() => {
        showToast(t.copySuccess || "Copied to clipboard!", 'success');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast(t.copyFail || "Failed to copy.", 'error');
    });
});


// --- UTILITY FUNCTIONS (showToast, fixNumbers, toEnglish, renderCompare) ---
// These functions are largely the same as provided in the previous response.
// Ensure fixNumbers and toEnglish are present.
// renderCompare should use t.originalTitle and t.translatedTitle from lang files.
// showToast should use t.closeBtnLabel.

function showToast(msg, type = 'info') { 
  const t = translations[currentLang] || {};
  const box = document.createElement('div');
  let bgColorClass = 'bg-blue-500'; // Default for info (Tailwind class from a palette)
  if (type === 'error') bgColorClass = 'bg-red-600'; // Danger color
  if (type === 'success') bgColorClass = 'bg-green-500'; // Success color
  if (type === 'warn') bgColorClass = 'bg-yellow-500'; // Warning color


  box.className = `fixed top-5 left-1/2 transform -translate-x-1/2 ${bgColorClass} text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center max-w-lg text-sm`;
  
  const messageSpan = document.createElement('span');
  messageSpan.style.wordBreak = 'break-word'; 
  messageSpan.textContent = msg;
  
  const closeButton = document.createElement('button');
  let closeBtnClass = 'ml-4 mr-0 text-white font-bold text-xl flex-shrink-0 opacity-70 hover:opacity-100'; 
  if (document.documentElement.dir === 'rtl') {
    closeBtnClass = 'mr-4 ml-0 text-white font-bold text-xl flex-shrink-0 opacity-70 hover:opacity-100';
  }
  closeButton.className = closeBtnClass;
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', t.closeBtnLabel || 'Close'); 
  
  closeButton.addEventListener('click', () => { box.remove(); });
  
  box.appendChild(messageSpan); box.appendChild(closeButton);
  document.body.appendChild(box);
  
  setTimeout(() => { if (box.parentNode) { box.remove(); } }, 8000); // 8 seconds
}

function fixNumbers(txt) {
  return txt.replace(/(\d{1,2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2},\d{3})|(\d+)/g, (match, srtTimestamp, standaloneNumber) => {
    if (srtTimestamp) { return srtTimestamp; }
    if (standaloneNumber) { return toEnglish(standaloneNumber); }
    return match; 
  });
}

function toEnglish(numStr) {
  const persianArabicMap = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
  return numStr.split('').map(char => persianArabicMap[char] || char).join('');
}

function renderCompare(orig, translated) {
  lastTranslatedText = translated; 
  const t = translations[currentLang] || {};

  const container = document.createElement('div');
  container.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mt-2'; // Increased gap
  
  const createSubtitleBox = (titleKey, defaultTitle, content) => {
      const boxContainer = document.createElement('div');
      const titleEl = document.createElement('h3');
      titleEl.className = 'text-lg font-semibold mb-2'; // Text color inherited or use var(--text-color-secondary)
      titleEl.textContent = t[titleKey] || defaultTitle;
      
      const preEl = document.createElement('pre');
      preEl.className = 'p-3 rounded-md text-sm max-h-80 overflow-y-auto border'; // Slightly reduced max-h
      preEl.style.backgroundColor = 'var(--input-bg)'; 
      preEl.style.borderColor = 'var(--input-border)'; 
      preEl.textContent = content;
      
      boxContainer.appendChild(titleEl);
      boxContainer.appendChild(preEl);
      return boxContainer;
  };
  
  container.appendChild(createSubtitleBox('originalTitle', "Original", orig));
  container.appendChild(createSubtitleBox('translatedTitle', "Translated", translated));
  return container;
}

// --- Initialize App ---
initializeApp();
