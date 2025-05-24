const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const responseBox = document.getElementById('response');
const modelSelect = document.getElementById('model');

sendBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const rawText = promptInput.value.trim();
  const model = modelSelect.value;

  if (!apiKey || !rawText) {
    alert('Please provide both API key and subtitle text.');
    return;
  }

  responseBox.textContent = 'Translating...';

  const prompt = `Translate the following subtitles:\n\n${rawText}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content.';
    responseBox.textContent = output;
  } catch (err) {
    console.error('Translation error:', err);
    responseBox.textContent = 'Translation failed. Please try again.';
  }
});
