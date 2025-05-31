// DOM Element Selections (بدون تغییر از پاسخ قبلی، فقط بخش‌های مربوطه نشان داده شده)
const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
// ... (سایر انتخابگرها)
const langSelect = document.getElementById('lang');
const fileNameText = document.getElementById("fileNameText");
const themeToggleBtn = document.getElementById('themeToggleBtn');
const appTitleH1 = document.getElementById('appTitleH1');
const responseContainer = document.getElementById('responseContainer');
const responseTitle = document.getElementById('responseTitle');
const responseBox = document.getElementById('response');
const modelSelect = document.getElementById('model'); // برای به‌روزرسانی متن مدل
const toneSelect = document.getElementById('tone');
const fileInputLabel = document.getElementById('fileInputLabel');
const langTarget = document.getElementById('langTarget');
const filenameInput = document.getElementById('filenameInput');
const downloadBtn = document.getElementById('downloadBtn');


// State Variables
const translations = {};
let currentLang = 'en'; 
let lastTranslatedText = "";

// --- THEME TOGGLE ---
function updateThemeToggleButtonAriaLabel(isDark) {
    if (translations[currentLang]) {
        const key = isDark ? 'themeToggleLight' : 'themeToggleDark';
        const fallbackText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        themeToggleBtn.setAttribute('aria-label', translations[currentLang][key] || fallbackText);
    }
}

function applyTheme(theme) { // theme is 'dark' or 'light'
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

// --- LANGUAGE HANDLING ---
function limitLanguageOptions() {
    const allowedLangs = ['en', 'fa'];
    Array.from(langSelect.options).forEach(option => {
        if (!allowedLangs.includes(option.value)) {
            option.remove();
        }
    });
}

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
  document.documentElement.lang = lang; 

  const rtlLangs = ['fa', 'ar', 'he', 'ur']; // 'ar' etc. can remain for generic RTL detection
  const isRTL = rtlLangs.includes(lang);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  
  const formContainer = document.getElementById('formContainer');
  if (formContainer) formContainer.dir = isRTL ? 'rtl' : 'ltr';

  document.title = t.appTitle || "Gemini Subtitle Translator";
  if(appTitleH1 && t.appTitleH1) appTitleH1.textContent = t.appTitleH1;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerText = t[key];
    else if (el.id === 'fileNameText' && key === 'fileNone') { // Strict: if key not found for fileNone, make it empty
        el.innerText = '';
    }
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
  
  const currentFile = fileInput.files[0];
  if (fileNameText) {
    // Strictly use translated string or empty if key is missing
    fileNameText.textContent = currentFile ? currentFile.name : (t.fileNone !== undefined ? t.fileNone : '');
  }
  
  if (responseTitle && t.responseTitle) responseTitle.textContent = t.responseTitle;
   if (responseBox && responseBox.textContent === (translations[currentLang]?.translatingPlaceholder || 'Translating...')) {
      responseBox.textContent = t.translatingPlaceholder !== undefined ? t.translatingPlaceholder : '...';
  }
  
  const currentThemeIsDark = document.body.classList.contains('dark-theme');
  updateThemeToggleButtonAriaLabel(currentThemeIsDark);

  if (t.tones && toneSelect) {
    const currentToneValue = toneSelect.value;
    toneSelect.innerHTML = "";
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
    if(!toneFound && t.tones.length > 0) {
        toneSelect.value = t.tones[0];
    }
  }

  if (t.models && modelSelect) {
    // Update model texts based on new keys which might include tier info directly
    Array.from(modelSelect.options).forEach(opt => {
        const modelKey = opt.value; // e.g., "gemini-1.5-flash-latest"
        if (t.models[modelKey]) { // t.models[modelKey] would be "🔵 Gemini 1.5 Flash (Latest)"
            opt.textContent = t.models[modelKey];
        }
    });
  }
}

async function loadLang(lang) {
  try {
    const res = await fetch(`lang/${lang}.json?v=cache_bust_2`); 
    if (!res.ok) throw new Error(`HTTP error ${res.status} for ${lang}.json`);
    const data = await res.json();
    translations[lang] = data;
    applyTranslations(lang);
  } catch (err) {
    console.error(err);
    if (lang !== 'en' && !translations[lang]) {
        showToast(`Could not load translations for ${lang}. Showing English.`, 'error');
        if (translations['en']) { 
            applyTranslations('en');
        } else { 
            await loadLang('en'); 
        }
    } else if (lang === 'en' && !translations['en']) {
        document.body.innerHTML = "Error loading essential language data.";
    }
  }
}

// --- API CALL & TRANSLATION LOGIC ---
sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawText = promptInput.value.trim();
  const model = modelSelect.value;
  const tone = toneSelect?.value || "Neutral"; 
  const langOut = langTarget?.value || "en";

  const currentTranslations = translations[currentLang] || {};


  if (!apiKey || !rawText) {
    return showToast(currentTranslations.errorMissing || 'API key and subtitle text are required.', 'error');
  }
  
  responseContainer.style.display = 'block';
  responseTitle.style.display = 'block'; // Show title when translation starts
  responseBox.innerHTML = ''; 
  responseBox.textContent = currentTranslations.translatingPlaceholder !== undefined ? currentTranslations.translatingPlaceholder : 'Translating...'; 

  downloadBtn.style.display = 'none'; 
  lastTranslatedText = "";

  const prompt = `Please translate the following subtitles from their original language into ${langOut}.
Maintain the original SRT formatting, including sequence numbers, timestamps (e.g., "00:00:20,123 --> 00:00:22,456"), and line breaks precisely.
Apply a ${tone} tone to the translated text portions only.
Ensure all numbers that are NOT part of SRT timestamps (e.g., numbers in dialogue like "10 dollars", "Chapter 5") are also translated or appropriately localized for the ${langOut} language.
Do not add any extra explanations, comments, or text beyond the translated subtitle content itself.

Original Subtitles:
${rawText}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      })
    });

    const responseBodyText = await res.text(); 

    if (!res.ok) {
      let errorData;
      let errorMessage = `API request failed with status ${res.status} ${res.statusText}.`;
      try {
        errorData = JSON.parse(responseBodyText);
        console.error('API Error Response (JSON):', errorData);
        errorMessage = errorData.error?.message || errorMessage;
        if (errorData.error?.details) {
            errorMessage += ` Details: ${JSON.stringify(errorData.error.details)}`;
        }
      } catch (e) {
        console.error('API Error Response (Non-JSON):', responseBodyText);
      }
      throw new Error(errorMessage);
    }
    
    const data = JSON.parse(responseBodyText); 

    if (data.promptFeedback && data.promptFeedback.blockReason) {
        const blockDetails = data.promptFeedback.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || 'No further details.';
        throw new Error(`Prompt blocked by API: ${data.promptFeedback.blockReason}. Details: ${blockDetails}`);
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) {
        console.error('No content in API response structure:', data);
        const noContentMsg = currentTranslations.errorAPI?.replace('{message}', 'No translation content received in API response structure.') || 'No translation content received.';
        throw new Error(noContentMsg);
    }
    
    const fixedOutput = fixNumbers(output);
    responseBox.innerHTML = ''; 
    responseBox.appendChild(renderCompare(rawText, fixedOutput));
    downloadBtn.style.display = "block";

  } catch (err) {
    console.error('Translation Error Details:', err);
    let displayMessage = err.message;
    // Avoid double "API Error:" prefix if already there
    if (err.message && currentTranslations.errorAPI && !err.message.toLowerCase().includes('api')) {
        displayMessage = currentTranslations.errorAPI.replace('{message}', err.message);
    } else if (!err.message) {
        displayMessage = currentTranslations.errorUnknown || 'An unknown error occurred.';
    }

    responseBox.innerHTML = ''; 
    responseTitle.style.display = 'none'; 
    showToast(displayMessage, 'error');
  }
});

// --- FILE HANDLING ---
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const currentTranslations = translations[currentLang] || {};

  if (fileNameText) {
    fileNameText.textContent = file ? file.name : (currentTranslations.fileNone !== undefined ? currentTranslations.fileNone : '');
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
    showToast("Error reading file: " + err.message, 'error'); // Consider localizing
    promptInput.value = '';
    if (fileNameText) fileNameText.textContent = currentTranslations.fileNone !== undefined ? currentTranslations.fileNone : '';
  }
});


// --- DOWNLOAD FUNCTIONALITY & UTILITIES (fixNumbers, toEnglish, renderCompare, showToast) 
// ... (این توابع از پاسخ قبلی بدون تغییر عمده باقی می‌مانند، فقط showToast کمی بهبود یافته) ...
// (تابع renderCompare باید برای ترجمه عناوین Original/Translated از فایل زبان استفاده کند)

function renderCompare(orig, translated) {
  lastTranslatedText = translated; 
  const t = translations[currentLang] || {};

  const container = document.createElement('div');
  container.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-2';
  
  const origContainer = document.createElement('div');
  const origTitle = document.createElement('h3');
  origTitle.className = 'text-lg font-semibold mb-1'; // Tailwind handles dark mode text color via body
  origTitle.textContent = t.originalTitle || "Original";
  const origPre = document.createElement('pre');
  // Use CSS variables for these backgrounds if desired, or stick to Tailwind
  origPre.className = 'bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600';
  origPre.textContent = orig;
  origContainer.appendChild(origTitle);
  origContainer.appendChild(origPre);

  const translatedContainer = document.createElement('div');
  const translatedTitle = document.createElement('h3');
  translatedTitle.className = 'text-lg font-semibold mb-1';
  translatedTitle.textContent = t.translatedTitle || "Translated";
  const translatedPre = document.createElement('pre');
  translatedPre.className = 'bg-gray-100 dark:bg-gray-600 p-3 rounded text-sm max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-500';
  translatedPre.textContent = translated;
  translatedContainer.appendChild(translatedTitle);
  translatedContainer.appendChild(translatedPre);
  
  container.appendChild(origContainer);
  container.appendChild(translatedContainer);
  return container;
}

function showToast(msg, type = 'info') { 
  const box = document.createElement('div');
  // For CSS Variable theming, these classes might need adjustment or removal if global styles handle it
  let bgColorClass = 'bg-blue-600'; 
  if (type === 'error') bgColorClass = 'bg-red-700';
  if (type === 'success') bgColorClass = 'bg-green-600';

  box.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColorClass} text-white px-4 py-3 rounded shadow-lg z-50 flex items-center max-w-md break-words`;
  
  const messageSpan = document.createElement('span');
  messageSpan.style.wordBreak = 'break-word'; 
  messageSpan.textContent = msg;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'ml-4 text-white font-bold text-xl flex-shrink-0'; 
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', translations[currentLang]?.closeBtnLabel || 'Close'); 
  
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
// Add fixNumbers and toEnglish from previous response here if they are not present

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


// --- INITIALIZATION ---
async function initializeApp() {
    limitLanguageOptions(); // Limit languages in dropdown first

    const themeToApply = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    // Apply theme class immediately to body
    if (themeToApply === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    // Aria-label for theme button will be set after translations load

    const initialLang = localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';
    const langExistsInSelect = Array.from(langSelect.options).some(option => option.value === initialLang);
    langSelect.value = langExistsInSelect ? initialLang : 'en'; // Default to 'en' if saved/detected not in limited list
    
    if (!allowedLangs.includes(langSelect.value)) { // Ensure selected lang is one of the allowed
        langSelect.value = 'en'; 
    }

    localStorage.setItem('lang', langSelect.value); 
    await loadLang(langSelect.value); 
}

const allowedLangs = ['en', 'fa']; // Define allowed languages globally for initializeApp
initializeApp();
