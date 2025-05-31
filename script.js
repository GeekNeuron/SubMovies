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
const fileInputLabel = document.getElementById('fileInputLabel'); // Added ID for robustness
const langTarget = document.getElementById('langTarget');
const filenameInput = document.getElementById('filenameInput');
const downloadBtn = document.getElementById('downloadBtn');
const fileNameText = document.getElementById("fileNameText");
const themeToggleBtn = document.getElementById('themeToggleBtn');

// State Variables
const translations = {};
let currentLang = 'en';
let lastTranslatedText = "";

// --- THEME TOGGLE ---
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    themeToggleBtn.setAttribute('aria-label', translations[currentLang]?.themeToggleLight || 'Switch to Light Mode');
  } else {
    document.documentElement.classList.remove('dark');
    themeToggleBtn.setAttribute('aria-label', translations[currentLang]?.themeToggleDark || 'Switch to Dark Mode');
  }
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(newTheme);
});

// Load saved theme or default to system preference / light
const savedTheme = localStorage.getItem('theme') || 
                   (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);


// --- LANGUAGE HANDLING ---
langSelect.addEventListener('change', (e) => {
  const lang = e.target.value;
  localStorage.setItem('lang', lang);
  loadLang(lang);
});

function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) return;
  currentLang = lang;

  const rtlLangs = ['fa', 'ar', 'he', 'ur'];
  const isRTL = rtlLangs.includes(lang);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  // formContainer might not exist if HTML structure changes, so check it.
  const formContainer = document.getElementById('formContainer');
  if (formContainer) formContainer.dir = isRTL ? 'rtl' : 'ltr';


  document.title = t.appTitle || "Gemini Subtitle Translator";

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerText = t[key];
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  
  // Specific placeholders if not covered by data-i18n-placeholder
  if (apiKeyInput && t.apiKeyPlaceholder) apiKeyInput.placeholder = t.apiKeyPlaceholder;
  if (promptInput && t.promptPlaceholder) promptInput.placeholder = t.promptPlaceholder;
  if (filenameInput && t.filenamePlaceholder) filenameInput.placeholder = t.filenamePlaceholder;


  if (downloadBtn && t.downloadBtn) downloadBtn.textContent = t.downloadBtn;
  if (fileInputLabel && t.fileChooseLabel) fileInputLabel.textContent = t.fileChooseLabel;
  if (fileNameText && !fileInput.files?.length && t.fileNone) fileNameText.textContent = t.fileNone;
  if (responseTitle && t.responseTitle) responseTitle.textContent = t.responseTitle;
  
  // Update theme toggle button aria-label based on current theme and new language
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  if (currentTheme === 'dark') {
    themeToggleBtn.setAttribute('aria-label', t.themeToggleLight || 'Switch to Light Mode');
  } else {
    themeToggleBtn.setAttribute('aria-label', t.themeToggleDark || 'Switch to Dark Mode');
  }

  if (t.tones && toneSelect) {
    toneSelect.innerHTML = ""; // Clear previous options
    t.tones.forEach(toneText => {
      const opt = document.createElement("option");
      opt.textContent = toneText;
      opt.value = toneText; // Assuming value is same as text
      toneSelect.appendChild(opt);
    });
  }

  if (t.models && modelSelect) {
    [...modelSelect.options].forEach(opt => {
      const val = opt.value;
      if (t.models[val]) {
        const isFree = val.includes('gemini-pro'); // Broader check for "gemini-pro"
        opt.textContent = isFree ? `🔵 ${t.models[val]}` : `🟢 ${t.models[val]}`;
      }
    });
  }
}

async function loadLang(lang) {
  try {
    const res = await fetch(`lang/${lang}.json?v=1`); // Cache bust for updates
    if (!res.ok) throw new Error(`Failed to load language file: ${lang}.json`);
    const data = await res.json();
    translations[lang] = data;
    applyTranslations(lang);
  } catch (err) {
    console.error(err);
    showToast(err.message || `Could not load language: ${lang}`, 'error');
  }
}

// --- API CALL & TRANSLATION LOGIC ---
sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawText = promptInput.value.trim();
  const model = modelSelect.value;
  const tone = toneSelect?.value || "Neutral";
  const langOut = langTarget?.value || "en";

  if (!apiKey || !rawText) {
    return showToast(translations[currentLang]?.errorMissing || 'API key and subtitle text are required.', 'error');
  }

  responseBox.textContent = translations[currentLang]?.translatingPlaceholder || 'Translating...';
  responseBox.innerHTML = ''; // Clear previous comparison
  responseTitle.style.display = 'block';
  downloadBtn.style.display = 'none'; // Hide download button during translation
  lastTranslatedText = "";

  const generationConfig = {
    // temperature: 0.7, // Example: Adjust creativity (0.0 to 1.0)
    // topK: 40,         // Example: Consider for diverse responses
    // topP: 0.95,       // Example: Consider for diverse responses
    // maxOutputTokens: 1024, // Example
  };

  const safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ];

  const prompt = `Please translate the following subtitles from their original language into ${langOut}.
Maintain the original SRT formatting (timing, sequence numbers).
Apply a ${tone} tone to the translation.
Ensure all numbers that are NOT part of SRT timestamps (e.g., "10 dollars", "Chapter 5") are also translated or appropriately localized for ${langOut}.
Do not translate or alter SRT timestamps like "00:00:20,123 --> 00:00:22,456".

Original Subtitles:
${rawText}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // generationConfig, // Uncomment to use custom generation config
        // safetySettings // Uncomment to use custom safety settings
      })
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (e) {
        // If response is not JSON or empty
        throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
      }
      console.error('API Error Response:', errorData);
      const errorMessage = errorData.error?.message || `API request failed with status ${res.status}.`;
      throw new Error(errorMessage);
    }

    const data = await res.json();

    if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`Prompt blocked: ${data.promptFeedback.blockReason}. ${data.promptFeedback.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || ''}`);
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) {
        console.error('No content in API response:', data);
        throw new Error(translations[currentLang]?.errorAPI?.replace('{message}', 'No translation content received from API.') || 'No translation content received.');
    }
    
    const fixedOutput = fixNumbers(output);
    responseBox.innerHTML = ''; // Clear "Translating..."
    responseBox.appendChild(renderCompare(rawText, fixedOutput));
    downloadBtn.style.display = "block";

  } catch (err) {
    console.error('Translation Error:', err);
    let displayMessage = err.message || translations[currentLang]?.errorUnknown || 'An unknown error occurred.';
    if (err.message && translations[currentLang]?.errorAPI) {
        displayMessage = translations[currentLang].errorAPI.replace('{message}', err.message);
    }
    responseBox.textContent = ''; // Clear "Translating..."
    showToast(displayMessage, 'error');
  }
});

// --- FILE HANDLING ---
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (fileNameText) {
    fileNameText.textContent = file ? file.name : (translations[currentLang]?.fileNone || "No file chosen");
  }
  if (!file) {
    promptInput.value = ''; // Clear textarea if no file is chosen or selection is cancelled
    return;
  }
  try {
    const text = await file.text();
    promptInput.value = text;
  } catch (err) {
    console.error("Error reading file:", err);
    showToast("Error reading file: " + err.message, 'error');
    promptInput.value = '';
    fileNameText.textContent = translations[currentLang]?.fileNone || "No file chosen";
  }
});

// --- DOWNLOAD FUNCTIONALITY ---
downloadBtn.addEventListener('click', () => {
  if (!lastTranslatedText) {
    showToast("No translated text to download.", "error");
    return;
  }
  let filename = filenameInput.value.trim();
  if (!filename) {
    const originalFileName = fileInput.files[0]?.name.replace(/\.srt$/i, '');
    filename = originalFileName ? `${originalFileName}_${langTarget.value}.srt` : `translated_subtitle_${langTarget.value}.srt`;
  } else if (!filename.toLowerCase().endsWith('.srt')) {
    filename += '.srt';
  }
  
  const blob = new Blob([lastTranslatedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); // Required for Firefox
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// --- UTILITY FUNCTIONS ---
function showToast(msg, type = 'info') { // type can be 'info', 'error', 'success'
  const box = document.createElement('div');
  let bgColor = 'bg-blue-600'; // Default for info
  if (type === 'error') bgColor = 'bg-red-700';
  if (type === 'success') bgColor = 'bg-green-600';

  box.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-4 py-3 rounded shadow-lg z-50 flex items-center`;
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = msg;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'ml-4 text-white font-bold text-xl';
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Close notification');
  
  closeButton.addEventListener('click', () => {
    box.remove();
  });
  
  box.appendChild(messageSpan);
  box.appendChild(closeButton);
  document.body.appendChild(box);
  
  setTimeout(() => {
    if (box.parentNode) { // Check if it hasn't been removed by user
        box.remove();
    }
  }, 10000);
}


function fixNumbers(txt) {
  // This regex is specific to SRT timestamps and might need adjustment
  // if the API returns timestamps in a slightly different format.
  // It currently preserves anything that looks like HH:MM:SS,ms
  return txt.replace(/(\d{1,2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2},\d{3})|(\d+)/g, (match, timestamp, number) => {
    if (timestamp) return timestamp; // if it's a full timestamp line, return as is
    if (number) return toEnglish(number); // if it's just a number, convert it
    return match; // fallback, should not happen with this regex
  });
}

function toEnglish(numStr) {
  const persianArabicMap = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', // Persian
                             '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'  // Arabic
                           };
  return numStr.split('').map(char => persianArabicMap[char] || char).join('');
}

function renderCompare(orig, translated) {
  lastTranslatedText = translated; // Store for download

  const container = document.createElement('div');
  container.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-2';
  
  const origContainer = document.createElement('div');
  const origTitle = document.createElement('h3');
  origTitle.className = 'text-lg font-semibold mb-1';
  origTitle.textContent = "Original"; // Consider localizing this
  const origPre = document.createElement('pre');
  origPre.className = 'bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm max-h-96 overflow-y-auto';
  origPre.textContent = orig;
  origContainer.appendChild(origTitle);
  origContainer.appendChild(origPre);

  const translatedContainer = document.createElement('div');
  const translatedTitle = document.createElement('h3');
  translatedTitle.className = 'text-lg font-semibold mb-1';
  translatedTitle.textContent = "Translated"; // Consider localizing this
  const translatedPre = document.createElement('pre');
  translatedPre.className = 'bg-gray-100 dark:bg-gray-600 p-3 rounded text-sm max-h-96 overflow-y-auto';
  translatedPre.textContent = translated;
  translatedContainer.appendChild(translatedTitle);
  translatedContainer.appendChild(translatedPre);
  
  container.appendChild(origContainer);
  container.appendChild(translatedContainer);
  return container;
}

// --- INITIALIZATION ---
// Load saved language or detect browser language, default to 'en'
const initialLang = localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';
// Ensure the selected language is actually available in the dropdown
const langExistsInSelect = Array.from(langSelect.options).some(option => option.value === initialLang);
langSelect.value = langExistsInSelect ? initialLang : 'en';

localStorage.setItem('lang', langSelect.value); // Save the potentially corrected lang
loadLang(langSelect.value);
