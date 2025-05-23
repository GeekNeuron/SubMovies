const fs = require('fs');
const path = require('path');

const LANGS = {
  en: { name: 'English', native: 'English', dir: 'ltr', title: 'Gemini Subtitle Translator', desc: 'Translate subtitles using Google Gemini' },
  fa: { name: 'Persian', native: 'فارسی', dir: 'rtl', title: 'مترجم زیرنویس جمینای', desc: 'ترجمه زیرنویس با استفاده از جمینای گوگل' },
  es: { name: 'Spanish', native: 'Español', dir: 'ltr', title: 'Traductor de Subtítulos', desc: 'Traduce subtítulos con Google Gemini' },
  // ...
};

const TEMPLATE = `<!DOCTYPE html>
<html lang="{{lang}}" dir="{{dir}}">
<head>
  <meta charset="UTF-8">
  <title>SubMovies - {{title}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-900 text-white">
  <header class="text-center p-6">
    <h1 class="text-3xl font-bold text-blue-400">SubMovies</h1>
    <p class="text-sm text-gray-300 mt-2">{{desc}}</p>
  </header>
  <main class="max-w-3xl mx-auto px-6">Open <a class="underline" href="/index.html">index.html</a> to use the app</main>
</body>
</html>`;

for (const [code, lang] of Object.entries(LANGS)) {
  const html = TEMPLATE.replace(/{{lang}}/g, code)
    .replace(/{{dir}}/g, lang.dir)
    .replace(/{{title}}/g, lang.title)
    .replace(/{{desc}}/g, lang.desc);
  const outDir = path.join('landing', code);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}
