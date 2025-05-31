// DOM Element Selections
const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const responseContainer = document.getElementById('responseContainer');
const responseTitle = document.getElementById('responseTitle');
const modelSelect = document.getElementById('model');
const langSelect = document.getElementById('lang');
const toneSelect = document.getElementById('tone');
const fileInput = document.getElementById('fileInput');
const fileInputLabel = document.getElementById('fileInputLabel');
const langTarget = document.getElementById('langTarget');
const filenameInput = document.getElementById('filenameInput');
const downloadBtn = document.getElementById('downloadBtn');
const fileNameText = document.getElementById("fileNameText");
const themeToggleBtn = document.getElementById('themeToggleBtn');
const appTitleH1 = document.getElementById('appTitleH1');


// State Variables
const translations = {};
let currentLang = 'en'; // Default language
let lastTranslatedText = "";

// --- THEME TOGGLE ---
function updateThemeToggleButtonAriaLabel(theme) {
    if (translations[currentLang]) {
        const newAriaLabel = theme === 'dark' ?
            (translations[currentLang].themeToggleLight || 'Switch to Light Mode') :
            (translations[currentLang].themeToggleDark || 'Switch to Dark Mode');
        themeToggleBtn.setAttribute('aria-label', newAriaLabel);
    }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeToggleButtonAriaLabel(theme); // Update aria-label after class change
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const currentThemeIsDark = document.documentElement.classList.contains('dark');
  const newTheme = currentThemeIsDark ? 'light' : 'dark';
  applyTheme(newTheme);
});

// Load saved theme or default to system preference / light
// This will run before translations are loaded, so aria-label will be updated in applyTranslations
const savedTheme = localStorage.getItem('theme') || 
                   (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
// Apply theme class immediately
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}


// --- LANGUAGE HANDLING ---
langSelect.addEventListener('change', (e) => {
  const lang = e.target.value;
  localStorage.setItem('lang', lang);
  loadLang(lang);
});

function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) {
    console.warn(`Translations for ${lang} not found.`);
    return;
  }
  currentLang = lang;
  document.documentElement.lang = lang; // Set lang attribute on HTML element

  const rtlLangs = ['fa', 'ar', 'he', 'ur'];
  const isRTL = rtlLangs.includes(lang);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  
  const formContainer = document.getElementById('formContainer');
  if (formContainer) formContainer.dir = isRTL ? 'rtl' : 'ltr';


  document.title = t.appTitle || "Gemini Subtitle Translator";
  if(appTitleH1 && t.appTitleH1) appTitleH1.textContent = t.appTitleH1;


  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerText = t[key];
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  
  if (apiKeyInput && t.apiKeyPlaceholder) apiKeyInput.placeholder = t.apiKeyPlaceholder;
  if (promptInput && t.promptPlaceholder) promptInput.placeholder = t.promptPlaceholder;
  if (filenameInput && t.filenamePlaceholder) filenameInput.placeholder = t.filenamePlaceholder;


  if (downloadBtn && t.downloadBtn) downloadBtn.textContent = t.downloadBtn;
  if (fileInputLabel && t.fileChooseLabel) fileInputLabel.textContent = t.fileChooseLabel;
  
  // Update fileNameText based on current file state and new language
  const currentFile = fileInput.files[0];
  if (fileNameText) {
    fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone || "No file chosen");
  }
  
  if (responseTitle && t.responseTitle) responseTitle.textContent = t.responseTitle;
  if (responseBox && !responseBox.hasChildNodes() && responseBox.textContent === (translations[currentLang]?.translatingPlaceholder || 'Translating...')) {
      // If it was showing "Translating...", update it
      responseBox.textContent = t.translatingPlaceholder || 'Translating...';
  }
  
  // Update theme toggle button aria-label based on current theme and newly loaded language
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  updateThemeToggleButtonAriaLabel(currentTheme);


  if (t.tones && toneSelect) {
    toneSelect.innerHTML = "";
    const currentToneValue = toneSelect.value; // Preserve selected tone if possible
    let toneFound = false;
    t.tones.forEach(toneText => {
      const opt = document.createElement("option");
      opt.textContent = toneText;
      opt.value = toneText; 
      if(toneText === currentToneValue) {
          opt.selected = true;
          toneFound = true;
      }
      toneSelect.appendChild(opt);
    });
    if(!toneFound && t.tones.length > 0) { // Default to first if previous not found
        toneSelect.value = t.tones[0];
    }
  }

  if (t.models && modelSelect) {
    [...modelSelect.options].forEach(opt => {
      const val = opt.value;
      if (t.models[val]) {
        // More robust check for "Free Tier" based on common model naming patterns
        const isFreeTier = val.includes('flash') || val === 'gemini-pro';
        opt.textContent = isFreeTier ? `🔵 ${t.models[val]}` : `🟢 ${t.models[val]}`;
      }
    });
  }
}

async function loadLang(lang) {
  try {
    const res = await fetch(`lang/${lang}.json?v=cache_bust_1`); 
    if (!res.ok) throw new Error(`HTTP error ${res.status} for ${lang}.json`);
    const data = await res.json();
    translations[lang] = data;
    applyTranslations(lang);
  } catch (err) {
    console.error(err);
    // Fallback to English if selected lang fails to load, but don't change the dropdown
    if (lang !== 'en' && !translations[lang]) {
        showToast(`Could not load translations for ${lang}. Showing English.`, 'error');
        if (translations['en']) { // If English is already loaded
            applyTranslations('en');
        } else { // If English also not loaded, try to load it
            await loadLang('en'); // This could be problematic if 'en' also fails
        }
    } else if (lang === 'en' && !translations['en']) {
        // Critical failure if English can't be loaded
        document.body.innerHTML = "Error loading essential language data. Please refresh or contact support.";
    }
  }
}

// --- API CALL & TRANSLATION LOGIC ---
sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawText = promptInput.value.trim();
  const model = modelSelect.value;
  const tone = toneSelect?.value || "Neutral"; // Ensure toneSelect has a default or is handled if empty
  const langOut = langTarget?.value || "en";

  if (!apiKey || !rawText) {
    return showToast(translations[currentLang]?.errorMissing || 'API key and subtitle text are required.', 'error');
  }
  
  responseContainer.style.display = 'block';
  responseTitle.style.display = 'block';
  responseBox.textContent = translations[currentLang]?.translatingPlaceholder || 'Translating...';
  responseBox.innerHTML = ''; // Clear previous comparison for "Translating..." text
  responseBox.textContent = translations[currentLang]?.translatingPlaceholder || 'Translating...'; // Set text content explicitly

  downloadBtn.style.display = 'none'; 
  lastTranslatedText = "";

  // Updated prompt
  const prompt = `Please translate the following subtitles from their original language into ${langOut}.
Maintain the original SRT formatting, including sequence numbers, timestamps (e.g., "00:00:20,123 --> 00:00:22,456"), and line breaks precisely.
Apply a ${tone} tone to the translated text portions only.
Ensure all numbers that are NOT part of SRT timestamps (e.g., numbers in dialogue like "10 dollars", "Chapter 5") are also translated or appropriately localized for the ${langOut} language.
Do not add any extra explanations, comments, or text beyond the translated subtitle content itself.

Original Subtitles:
${rawText}`;

  try {
    console.log("Sending request to Gemini API with model:", model);
    console.log("Prompt length:", prompt.length);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // safetySettings: [...] // Consider adding safety settings if needed
      })
    });

    const responseBodyText = await res.text(); // Get response text first for debugging

    if (!res.ok) {
      let errorData;
      let errorMessage = `API request failed with status ${res.status} ${res.statusText}.`;
      try {
        errorData = JSON.parse(responseBodyText);
        console.error('API Error Response (JSON):', errorData);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        console.error('API Error Response (Non-JSON):', responseBodyText);
        // errorMessage remains the HTTP status if parsing fails
      }
      throw new Error(errorMessage);
    }
    
    const data = JSON.parse(responseBodyText); // Parse if res.ok

    if (data.promptFeedback && data.promptFeedback.blockReason) {
        const blockDetails = data.promptFeedback.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || 'No further details.';
        throw new Error(`Prompt blocked by API: ${data.promptFeedback.blockReason}. Details: ${blockDetails}`);
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) {
        console.error('No content in API response structure:', data);
        throw new Error(translations[currentLang]?.errorAPI?.replace('{message}', 'No translation content received in API response structure.') || 'No translation content received.');
    }
    
    const fixedOutput = fixNumbers(output);
    responseBox.innerHTML = ''; 
    responseBox.appendChild(renderCompare(rawText, fixedOutput));
    downloadBtn.style.display = "block";

  } catch (err) {
    console.error('Translation Error Details:', err);
    let displayMessage = err.message || (translations[currentLang]?.errorUnknown || 'An unknown error occurred.');
    if (err.message && translations[currentLang]?.errorAPI && !err.message.startsWith("API request failed") && !err.message.startsWith("Prompt blocked")) {
        // Use the generic API error format if it's not an HTTP or block error already formatted
        displayMessage = translations[currentLang].errorAPI.replace('{message}', err.message);
    }
    responseBox.innerHTML = ''; // Clear "Translating..." or any partial content
    responseTitle.style.display = 'none'; // Hide title on error
    showToast(displayMessage, 'error');
  }
});

// --- FILE HANDLING ---
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const currentTranslations = translations[currentLang] || {}; // Fallback to empty if not loaded

  if (fileNameText) {
    fileNameText.textContent = file ? file.name : (currentTranslations.fileNone || "No file chosen");
  }
  if (!file) {
    promptInput.value = ''; 
    return;
  }
  try {
    const text = await file.text();
    promptInput.value = text;
  } catch (err) {
    console.error("Error reading file:", err);
    showToast("Error reading file: " + err.message, 'error');
    promptInput.value = '';
    if (fileNameText) fileNameText.textContent = currentTranslations.fileNone || "No file chosen";
  }
});

// --- DOWNLOAD FUNCTIONALITY ---
downloadBtn.addEventListener('click', () => {
  if (!lastTranslatedText) {
    showToast("No translated text to download.", "error"); // Consider localizing this
    return;
  }
  let filename = filenameInput.value.trim();
  if (!filename) {
    const originalFileName = fileInput.files[0]?.name.replace(/\.srt$/i, '');
    const targetLangCode = langTarget.value || 'trans';
    filename = originalFileName ? `${originalFileName}_${targetLangCode}.srt` : `translated_subtitle_${targetLangCode}.srt`;
  } else if (!filename.toLowerCase().endsWith('.srt')) {
    filename += '.srt';
  }
  
  const blob = new Blob([lastTranslatedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); 
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// --- UTILITY FUNCTIONS ---
function showToast(msg, type = 'info') { 
  const box = document.createElement('div');
  let bgColor = 'bg-blue-600'; 
  if (type === 'error') bgColor = 'bg-red-700';
  if (type === 'success') bgColor = 'bg-green-600';

  box.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-4 py-3 rounded shadow-lg z-50 flex items-center max-w-md break-words`; // Added max-w and break-words
  
  const messageSpan = document.createElement('span');
  messageSpan.style.wordBreak = 'break-word'; // Ensure long messages wrap
  messageSpan.textContent = msg;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'ml-4 text-white font-bold text-xl flex-shrink-0'; // flex-shrink-0
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Close'); // Localize if needed
  
  closeButton.addEventListener('click', () => {
    box.remove();
  });
  
  box.appendChild(messageSpan);
  box.appendChild(closeButton);
  document.body.appendChild(box);
  
  setTimeout(() => {
    if (box.parentNode) { 
        box.remove();
    }
  }, 10000);
}


function fixNumbers(txt) {
  // This regex attempts to preserve SRT timestamps and convert other numbers.
  // It's complex due to the nature of SRT and potential API output variations.
  // Format: 00:00:20,123 --> 00:00:22,456
  // Or sometimes just the numbers in dialogue.
  return txt.replace(/(\d{1,2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2},\d{3})|(\d+)/g, (match, srtTimestamp, standaloneNumber) => {
    if (srtTimestamp) {
      return srtTimestamp; // Return SRT timestamp block as is
    }
    if (standaloneNumber) {
      return toEnglish(standaloneNumber); // Convert standalone numbers
    }
    return match; // Fallback, should ideally not be reached often
  });
}

function toEnglish(numStr) {
  const persianArabicMap = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', 
                             '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'  
                           };
  return numStr.split('').map(char => persianArabicMap[char] || char).join('');
}

function renderCompare(orig, translated) {
  lastTranslatedText = translated; 

  const container = document.createElement('div');
  container.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-2';
  
  const origContainer = document.createElement('div');
  const origTitle = document.createElement('h3');
  origTitle.className = 'text-lg font-semibold mb-1 text-gray-700 dark:text-gray-300';
  origTitle.textContent = translations[currentLang]?.originalTitle || "Original";
  const origPre = document.createElement('pre');
  origPre.className = 'bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600';
  origPre.textContent = orig;
  origContainer.appendChild(origTitle);
  origContainer.appendChild(origPre);

  const translatedContainer = document.createElement('div');
  const translatedTitle = document.createElement('h3');
  translatedTitle.className = 'text-lg font-semibold mb-1 text-gray-700 dark:text-gray-300';
  translatedTitle.textContent = translations[currentLang]?.translatedTitle || "Translated";
  const translatedPre = document.createElement('pre');
  translatedPre.className = 'bg-gray-100 dark:bg-gray-600 p-3 rounded text-sm max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-500';
  translatedPre.textContent = translated;
  translatedContainer.appendChild(translatedTitle);
  translatedContainer.appendChild(translatedPre);
  
  container.appendChild(origContainer);
  container.appendChild(translatedContainer);
  return container;
}

// --- INITIALIZATION ---
async function initializeApp() {
    // Apply theme class first before any content rendering that depends on it
    const themeToApply = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (themeToApply === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    // Note: aria-label for theme button will be set after translations load

    const initialLang = localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';
    const langExistsInSelect = Array.from(langSelect.options).some(option => option.value === initialLang);
    langSelect.value = langExistsInSelect ? initialLang : 'en';
    
    localStorage.setItem('lang', langSelect.value); 
    await loadLang(langSelect.value); // Wait for initial language to load
}

initializeApp();
