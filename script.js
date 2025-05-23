const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const modelSelect = document.getElementById('model');
const historyList = document.getElementById('history');
const themeToggle = document.getElementById('themeToggle');

const TONE_OPTIONS = ['رسمی', 'معیار', 'محاوره‌ای', 'کوچه‌بازاری', 'ادبی', 'فاخر', 'تخصصی'];
const SPLIT_OPTIONS = ['یکجا', 'چندبخشی'];

// Create tone selector
let toneSelect = document.createElement('select');
toneSelect.id = 'tone';
toneSelect.className = 'w-full p-2 mb-4 rounded bg-gray-700 border border-gray-600 text-white';
TONE_OPTIONS.forEach(t => {
  let option = document.createElement('option');
  option.value = t;
  option.innerText = t;
  toneSelect.appendChild(option);
});

// Create split selector
let splitSelect = document.createElement('select');
splitSelect.id = 'split';
splitSelect.className = 'w-full p-2 mb-4 rounded bg-gray-700 border border-gray-600 text-white';
SPLIT_OPTIONS.forEach(s => {
  let option = document.createElement('option');
  option.value = s;
  option.innerText = `ترجمه به‌صورت ${s}`;
  splitSelect.appendChild(option);
});

document.querySelector('textarea').insertAdjacentElement('beforebegin', splitSelect);
document.querySelector('textarea').insertAdjacentElement('beforebegin', toneSelect);

// File input
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.srt';
fileInput.className = 'mb-4';
document.querySelector('textarea').insertAdjacentElement('beforebegin', fileInput);

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  promptInput.value = text;
});

// Drag & drop for SRT upload
const dropZone = document.createElement('div');
dropZone.className = 'w-full border-2 border-dashed border-blue-500 text-sm text-gray-300 rounded p-4 mb-4 text-center';
dropZone.textContent = 'فایل SRT خود را اینجا رها کنید یا روی کادر کلیک نمایید';
dropZone.ondragover = e => { e.preventDefault(); dropZone.classList.add('bg-blue-900/20'); };
dropZone.ondragleave = () => dropZone.classList.remove('bg-blue-900/20');
dropZone.onclick = () => fileInput.click();
dropZone.ondrop = async (e) => {
  e.preventDefault();
  dropZone.classList.remove('bg-blue-900/20');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.srt')) {
    const text = await file.text();
    promptInput.value = text;
  }
};
fileInput.style.display = 'none';
fileInput.parentNode.insertBefore(dropZone, fileInput);

// Dark theme default
localStorage.setItem('theme', 'dark');
document.body.classList.remove('bg-white', 'text-black');
document.body.classList.add('bg-gray-900', 'text-white');

// IndexedDB save
let db;
const dbRequest = indexedDB.open('SubMoviesDB', 1);
dbRequest.onsuccess = e => db = e.target.result;
dbRequest.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains('translations')) {
    db.createObjectStore('translations', { keyPath: 'id', autoIncrement: true });
  }
};
function saveOffline(prompt, response) {
  if (!db) return;
  const tx = db.transaction('translations', 'readwrite');
  tx.objectStore('translations').add({ prompt, response, time: Date.now() });
}

// History localStorage
function updateHistory(prompt) {
  const li = document.createElement('li');
  li.textContent = prompt.slice(0, 80);
  li.className = 'cursor-pointer hover:underline';
  li.onclick = () => promptInput.value = prompt;
  historyList.prepend(li);
}
function saveHistory(prompt) {
  const history = JSON.parse(localStorage.getItem('prompt_history') || '[]');
  history.unshift(prompt);
  localStorage.setItem('prompt_history', JSON.stringify(history.slice(0, 20)));
  updateHistory(prompt);
}
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('prompt_history') || '[]');
  history.forEach(updateHistory);
}

// Side-by-side preview
function renderSideBySide(original, translated) {
  const container = document.createElement('div');
  container.className = 'grid grid-cols-2 gap-4 text-sm mt-6';
  const left = document.createElement('pre');
  const right = document.createElement('pre');
  left.className = 'bg-gray-700 p-4 rounded whitespace-pre-wrap';
  right.className = 'bg-gray-800 p-4 rounded whitespace-pre-wrap';
  left.textContent = original;
  right.textContent = translated;
  container.appendChild(left);
  container.appendChild(right);
  return container;
}

// Translate with Gemini
sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawPrompt = promptInput.value.trim();
  const model = modelSelect.value;
  const tone = toneSelect.value;
  const split = splitSelect.value;
  if (!apiKey || !rawPrompt) return alert('API key and prompt required');
  localStorage.setItem('gemini_api_key', apiKey);
  saveHistory(rawPrompt);
  responseBox.innerHTML = 'Loading...';

  const prompt = `با لحن ${tone} این متن را ${split === 'چندبخشی' ? 'به صورت پاراگرافی و چند بخشی' : 'یکجا'} ترجمه کن، فقط محتوای ترجمه‌شده را بده:\n${rawPrompt}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    const cleanOutput = fixTranslatedNumbers(output);
    responseBox.innerHTML = '';
    responseBox.appendChild(renderSideBySide(rawPrompt, cleanOutput));
    saveOffline(prompt, cleanOutput);
  } catch (e) {
    responseBox.textContent = 'Error: ' + e.message;
  }
});

// Digit normalizer
function fixTranslatedNumbers(text) {
  return text.replace(/\d+/g, match => /\d{2}:\d{2}:\d{2},\d{3}/.test(match) ? match : toEnglishNumber(match));
}
function toEnglishNumber(num) {
  const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
                '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
  return num.split('').map(c => map[c] || c).join('');
}

// Init
loadHistory();
