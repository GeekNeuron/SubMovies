// script.js – Full Combined Version: Gemini + UI + i18n + Toast

const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const modelSelect = document.getElementById('model');
const langSelect = document.getElementById('lang');

const TONE_OPTIONS = ['Formal', 'Neutral', 'Casual', 'Street', 'Literary', 'Classic', 'Technical'];
const SPLIT_OPTIONS = ['Single Block', 'Multiple Parts'];

const translations = {};
let currentLang = 'en';

// Create tone dropdown
const toneLabel = document.createElement('label');
toneLabel.htmlFor = 'tone';
toneLabel.className = 'block mb-2 text-sm font-medium';
toneLabel.innerText = 'Choose tone';
const toneSelect = document.createElement('select');
toneSelect.id = 'tone';
toneSelect.className = 'w-full p-2 mb-4 rounded bg-gray-700 border border-gray-600 text-white';
TONE_OPTIONS.forEach(tone => {
  const opt = document.createElement('option');
  opt.value = tone;
  opt.innerText = tone;
  toneSelect.appendChild(opt);
});
promptInput.insertAdjacentElement('beforebegin', toneSelect);
promptInput.insertAdjacentElement('beforebegin', toneLabel);

// Create split dropdown
const splitLabel = document.createElement('label');
splitLabel.htmlFor = 'split';
splitLabel.className = 'block mb-2 text-sm font-medium';
splitLabel.innerText = 'Split translation';
const splitSelect = document.createElement('select');
splitSelect.id = 'split';
splitSelect.className = 'w-full p-2 mb-4 rounded bg-gray-700 border border-gray-600 text-white';
SPLIT_OPTIONS.forEach(optText => {
  const opt = document.createElement('option');
  opt.value = optText;
  opt.innerText = optText;
  splitSelect.appendChild(opt);
});
toneSelect.insertAdjacentElement('afterend', splitSelect);
splitSelect.insertAdjacentElement('beforebegin', splitLabel);

// File upload
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.srt';
fileInput.className = 'mb-4';
splitSelect.insertAdjacentElement('afterend', fileInput);
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  promptInput.value = text;
});

// Toast error
function showToast(msg) {
  const box = document.createElement('div');
  box.className = 'fixed top-4 left-4 bg-red-700 text-white px-4 py-2 rounded shadow z-50';
  box.innerHTML = `<div class="flex justify-between items-center"><span>${msg}</span><button class="ml-3 text-white font-bold" onclick="this.parentNode.parentNode.remove()">×</button></div>`;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 10000);
}

// Translate logic
sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawText = promptInput.value.trim();
  const model = modelSelect.value;
  const tone = toneSelect.value;
  const split = splitSelect.value;

  if (!apiKey || !rawText) return showToast('API key and subtitle text required.');

  responseBox.textContent = 'Translating...';
  const prompt = `Translate this subtitle text with a ${tone} tone as ${split === 'Multiple Parts' ? 'separated paragraphs' : 'a single paragraph'}:\n\n${rawText}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!data || data.error) throw new Error(data.error?.message || 'No response');
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content.';
    const fixed = fixNumbers(output);
    responseBox.innerHTML = '';
    responseBox.appendChild(renderCompare(rawText, fixed));
  } catch (err) {
    showToast(err.message);
    responseBox.innerHTML = `<pre class='text-red-400'>Error: ${err.message}</pre>`;
  }
});

// Fix numbers inside translation (keep timeline)
function fixNumbers(txt) {
  return txt.replace(/\d+/g, n => /\d{2}:\d{2}:\d{2},\d{3}/.test(n) ? n : toEnglish(n));
}
function toEnglish(num) {
  const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
  return num.split('').map(c => map[c] || c).join('');
}

// Compare original vs translated
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

// Load language json
async function loadLang(lang) {
  const res = await fetch(`lang/${lang}.json`);
  const data = await res.json();
  translations[lang] = data;
  applyLang(lang);
}

function applyLang(lang) {
  currentLang = lang;
  const t = translations[lang];
  document.title = t.title;
  document.querySelector('label[for="apiKey"]').innerText = t.apiKey;
  document.querySelector('label[for="model"]').innerText = t.model;
  toneLabel.innerText = t.tone;
  splitLabel.innerText = t.split;
  sendBtn.innerText = t.translate;
  promptInput.placeholder = t.placeholder;

  [...modelSelect.options].forEach(opt => {
    opt.textContent = opt.value.includes('pro') ? `🔵 ${t.models[opt.value] || opt.value}` : `🟢 ${t.models[opt.value] || opt.value}`;
  });
}

langSelect.addEventListener('change', (e) => loadLang(e.target.value));
loadLang('en');
