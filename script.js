const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const modelSelect = document.getElementById('model');
const langSelect = document.getElementById('lang');
const toneSelect = document.getElementById('tone');
const splitSelect = document.getElementById('split');
const fileInput = document.getElementById('fileInput');

const translations = {};
let currentLang = 'en';

langSelect.addEventListener('change', (e) => {
  const lang = e.target.value;
  localStorage.setItem('lang', lang);
  loadLang(lang);
});

function applyLang(lang) {
  const t = translations[lang];
  currentLang = lang;

  document.title = t.title;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerText = t[key];
  });

  promptInput.placeholder = t.placeholder;
  apiKeyInput.placeholder = t.apiKey;

  // Tone select
  if (t.tones && toneSelect) {
    toneSelect.innerHTML = "";
    t.tones.forEach(txt => {
      const opt = document.createElement("option");
      opt.textContent = txt;
      toneSelect.appendChild(opt);
    });
  }

  // Split select
  if (t.splits && splitSelect) {
    splitSelect.innerHTML = "";
    t.splits.forEach(txt => {
      const opt = document.createElement("option");
      opt.textContent = txt;
      splitSelect.appendChild(opt);
    });
  }

  // File choose label
  if (fileInput?.previousElementSibling?.tagName === "LABEL") {
    fileInput.previousElementSibling.textContent = t.fileChoose || "Choose file";
  }

  // Model select
  [...modelSelect.options].forEach(opt => {
    const val = opt.value;
    if (t.models[val]) {
      const isFree = val === 'gemini-pro' || val === 'gemini-pro:latest';
      opt.textContent = isFree ? `🔵 ${t.models[val]}` : `🟢 ${t.models[val]}`;
    }
  });

  // RTL layout
  const rtlLangs = ['fa', 'ar', 'he', 'ur'];
  document.getElementById('formContainer').dir = rtlLangs.includes(lang) ? 'rtl' : 'ltr';
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
  const tone = toneSelect.value;
  const split = splitSelect.value;

  if (!apiKey || !rawText) {
    return showToast(translations[currentLang]?.errorMissing || 'Missing input.');
  }

  responseBox.textContent = 'Translating...';

  const prompt = `Translate this subtitle text with a ${tone} tone as ${split === 'Multiple Parts' ? 'separated paragraphs' : 'a single paragraph'}:\n\n${rawText}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!data || data.error) throw new Error(translations[currentLang]?.errorAPI || 'No response');
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content.';
    const fixed = fixNumbers(output);
    responseBox.innerHTML = '';
    responseBox.appendChild(renderCompare(rawText, fixed));
  } catch (err) {
    showToast(err.message);
  }
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
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

// Initialize
const savedLang = localStorage.getItem('lang') || navigator.language.slice(0, 2) || 'en';
langSelect.value = savedLang;
loadLang(savedLang);
