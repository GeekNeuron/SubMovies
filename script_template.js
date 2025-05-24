const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const modelSelect = document.getElementById('model');
const langSelect = document.getElementById('lang');
const toneSelect = document.getElementById('tone');
const fileInput = document.getElementById('fileInput');
const langTarget = document.getElementById('langTarget');
const langList = new Intl.DisplayNames(['en'], { type: 'language' });
const sortedLangs = [...Intl.supportedValuesOf('language')].sort();
sortedLangs.forEach(code => {
  const opt = document.createElement('option');
  opt.value = code;
  opt.textContent = `${langList.of(code)} (${code})`;
  langTarget.appendChild(opt);
});

const translations = {};
let currentLang = 'en';
let lastTranslatedText = "";

// download filename input
const form = document.getElementById('formContainer');

const label = document.createElement('label');
label.htmlFor = 'filenameInput';
label.setAttribute('data-i18n', 'filename');
label.className = 'block mb-2 text-sm font-medium';
label.textContent = 'File name';

const filenameInput = document.createElement('input');
filenameInput.type = 'text';
filenameInput.id = 'filenameInput';
filenameInput.value = 'Subtitle.srt';
filenameInput.className = "w-full p-2 mb-4 rounded bg-gray-700 border border-gray-600 text-white";
filenameInput.placeholder = "Subtitle.srt";

form.insertBefore(label, document.getElementById('sendBtn'));
form.insertBefore(filenameInput, document.getElementById('sendBtn'));

// download button
const downloadBtn = document.createElement('button');
downloadBtn.id = "downloadBtn";
downloadBtn.className = "w-full mt-2 bg-green-600 hover:bg-green-700 py-2 rounded text-white font-semibold";
downloadBtn.textContent = "Download .srt";
downloadBtn.style.display = "none";
document.getElementById('formContainer').appendChild(downloadBtn);

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([lastTranslatedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameInput.value.trim() || "translated.srt";
  a.click();
  URL.revokeObjectURL(url);
});

langSelect.addEventListener('change', (e) => {
  const lang = e.target.value;
  localStorage.setItem('lang', lang);
  loadLang(lang);
});

function applyLang(lang) {
  const t = translations[lang];
  currentLang = lang;
  const rtlLangs = ['fa', 'ar', 'he', 'ur'];
document.documentElement.dir = rtlLangs.includes(lang) ? 'rtl' : 'ltr';

  document.title = t.title;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerText = t[key];
  });

  promptInput.placeholder = t.placeholder;
  apiKeyInput.placeholder = t.apiKey;

  if (t.tones && toneSelect) {
    toneSelect.innerHTML = "";
    t.tones.forEach(txt => {
      const opt = document.createElement("option");
      opt.textContent = txt;
      toneSelect.appendChild(opt);
    });
  }

  const fileLabel = fileInput?.previousElementSibling;
  if (fileLabel?.tagName === "LABEL") {
    fileLabel.textContent = t.fileChoose || "Choose file";
  }

  const fileNameText = document.getElementById("fileNameText");
  if (fileNameText) {
    fileNameText.textContent = t.fileNone || "No file chosen";
  }

  [...modelSelect.options].forEach(opt => {
    const val = opt.value;
    if (t.models[val]) {
      const isFree = val === 'gemini-pro' || val === 'gemini-pro:latest';
      opt.textContent = isFree ? `🔵 ${t.models[val]}` : `🟢 ${t.models[val]}`;
    }
  });

  const rtlLangs = ['fa', 'ar', 'he', 'ur'];
  document.getElementById('formContainer').dir = rtlLangs.includes(lang) ? 'rtl' : 'ltr';

  if (downloadBtn) downloadBtn.textContent = t.download || "Download .srt";
}

async function loadLang(lang) {
  const res = await fetch(`lang/${lang}.json`);
  const data = await res.json();
  translations[lang] = data;
  applyLang(lang);
}

sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawText = promptInput.value.trim();
  const model = modelSelect.value;
  const tone = toneSelect?.value || "Neutral";
  const langOut = langTarget?.value || "en";

  console.log({ apiKey, rawText, model, tone, langOut });

  if (!apiKey || !rawText) {
    return showToast(translations[currentLang]?.errorMissing || 'Missing input.');
  }

  responseBox.textContent = 'Translating...';

const translationPrompt = `Translate the following subtitles to ${langOut} using ${tone} tone:\n\n${rawText}`;
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: translationPrompt }] }] })
    });

    const data = await res.json();
    console.log('Gemini response:', data);

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content.';
    const fixed = fixNumbers(output);
    responseBox.innerHTML = '';
    responseBox.appendChild(renderCompare(rawText, fixed));
  } catch (err) {
    console.error("Translate failed:", err);
    showToast(err.message || "An unknown error occurred.");
  }
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const fileNameText = document.getElementById("fileNameText");
  if (fileNameText) {
    fileNameText.textContent = file ? file.name : translations[currentLang]?.fileNone || "No file chosen";
  }
  if (!file) return;
  const text = await file.text();
  promptInput.value = text;
});

function showToast(msg) {
  const box = document.createElement('div');
  box.className = 'fixed top-4 left-4 bg-red-700 text-white px-4 py-2 rounded shadow z-50';
  box.innerHTML = `<div class="flex justify-between items-center"><span>${msg}</span><button class="ml-3 text-white font-bold" onclick="this.parentNode.parentNode.remove()">×</button></div>`;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 10000);
}

function fixNumbers(txt) {
  return txt.replace(/\d+/g, n => /\d{2}:\d{2}:\d{2},\d{3}/.test(n) ? n : toEnglish(n));
}
function toEnglish(num) {
  const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
  return num.split('').map(c => map[c] || c).join('');
}

function renderCompare(orig, translated) {
  lastTranslatedText = translated;
  downloadBtn.style.display = "block";

  const container = document.createElement('div');
  container.className = 'grid grid-cols-2 gap-4 mt-6';
  const left = document.createElement('pre');
  const right = document.createElement('pre');
  left.className = 'bg-gray-700 p-3 rounded';
  right.className = 'bg-gray-800 p-3 rounded';
  left.textContent = orig;
  right.textContent = translated;
  container.appendChild(left);
  container.appendChild(right);
  return container;
}

const savedLang = localStorage.getItem('lang') || navigator.language.slice(0, 2) || 'en';
langSelect.value = savedLang;
localStorage.setItem('lang', savedLang);
loadLang(savedLang);
