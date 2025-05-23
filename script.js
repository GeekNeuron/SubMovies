const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const modelSelect = document.getElementById('model');

// Rebuild model selector with free/paid markers
const MODELS = [
  { value: 'gemini-pro', label: '🔵 Free – gemini-pro' },
  { value: 'gemini-pro:latest', label: '🔵 Free – gemini-pro:latest' },
  { value: 'gemini-1.0-pro', label: '🟢 Paid – gemini-1.0-pro' },
  { value: 'gemini-1.5-pro-latest', label: '🟢 Paid – gemini-1.5-pro-latest' },
  { value: 'gemini-pro-vision', label: '🟢 Paid – gemini-pro-vision' },
];

modelSelect.innerHTML = '';
MODELS.forEach(({ value, label }) => {
  const opt = document.createElement('option');
  opt.value = value;
  opt.innerText = label;
  modelSelect.appendChild(opt);
});

const TONE_OPTIONS = ['Formal', 'Neutral', 'Casual', 'Street', 'Literary', 'Classic', 'Technical'];
const SPLIT_OPTIONS = ['Single Block', 'Multiple Parts'];

// Tone dropdown
let toneSelect = document.createElement('select');
toneSelect.id = 'tone';
toneSelect.className = 'w-full p-2 mb-4 rounded bg-gray-700 border border-gray-600 text-white';
TONE_OPTIONS.forEach(tone => {
  let opt = document.createElement('option');
  opt.value = tone;
  opt.innerText = tone;
  toneSelect.appendChild(opt);
});
promptInput.insertAdjacentElement('beforebegin', toneSelect);

// Split dropdown
let splitSelect = document.createElement('select');
splitSelect.id = 'split';
splitSelect.className = 'w-full p-2 mb-4 rounded bg-gray-700 border border-gray-600 text-white';
SPLIT_OPTIONS.forEach(split => {
  let opt = document.createElement('option');
  opt.value = split;
  opt.innerText = `Translate as: ${split}`;
  splitSelect.appendChild(opt);
});
toneSelect.insertAdjacentElement('afterend', splitSelect);

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

// Gemini translate handler
sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawText = promptInput.value.trim();
  const model = modelSelect.value;
  const tone = toneSelect.value;
  const split = splitSelect.value;

  if (!apiKey || !rawText) return alert('API key and text are required');

  responseBox.textContent = 'Sending request...';

  const prompt = `Translate this subtitle text with a ${tone} tone as ${split === 'Multiple Parts' ? 'separated paragraphs' : 'a single paragraph'}:\n\n${rawText}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await res.json();
    console.log('Gemini raw response:', data);

    if (!data || data.error) {
      throw new Error(data.error?.message || 'Unknown error from Gemini API');
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content received.';
    const fixed = fixNumbers(output);
    responseBox.innerHTML = '';
    responseBox.appendChild(renderCompare(rawText, fixed));

  } catch (err) {
    responseBox.innerHTML = `<pre class="text-red-400">Error: ${err.message}</pre>`;
    console.error('Gemini Error:', err);
  }
});

// Clean digits – keep timeline format intact
function fixNumbers(txt) {
  return txt.replace(/\d+/g, n => /\d{2}:\d{2}:\d{2},\d{3}/.test(n) ? n : toEnglish(n));
}
function toEnglish(num) {
  const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
  return num.split('').map(c => map[c] || c).join('');
}

// Compare display
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
