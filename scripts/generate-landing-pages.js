const fs = require('fs');
const path = require('path');

// Ensure LANGS object has all necessary languages if you expand beyond fa/en for landing pages
const LANGS = {
  en: { name: 'English', native: 'English', dir: 'ltr', title: 'Gemini Subtitle Translator', desc: 'Translate subtitles using Google Gemini' },
  fa: { name: 'Persian', native: 'فارسی', dir: 'rtl', title: 'مترجم زیرنویس جمینای', desc: 'ترجمه زیرنویس با استفاده از جمینای گوگل' },
  es: { name: 'Spanish', native: 'Español', dir: 'ltr', title: 'Traductor de Subtítulos', desc: 'Traduce subtítulos con Google Gemini' },
  // ... (Add other 10 languages from your sitemap.xml if needed)
};

const TEMPLATE = `<!DOCTYPE html>
<html lang="{{lang}}" dir="{{dir}}">
<head>
  <meta charset="UTF-8">
  <title>SubMovies - {{title}}</title>
  <meta name="description" content="{{desc}} - SubMovies">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4">
  <header class="text-center p-6">
    <h1 class="text-4xl font-bold text-blue-400">SubMovies</h1>
    <p class="text-lg text-gray-300 mt-2 mb-6">{{desc}}</p>
  </header>
  <main class="max-w-xl mx-auto px-6 text-center">
    <p class="text-xl">
      Open the <a class="underline text-blue-300 hover:text-blue-100" href="../../index.html">SubMovies Translator App</a> to start translating.
    </p>
  </main>
  <footer class="text-center text-xs text-gray-500 mt-10">
    <p>&copy; ${new Date().getFullYear()} SubMovies by GeekNeuron</p>
  </footer>
</body>
</html>`;

console.log('Generating landing pages...');
for (const [code, lang] of Object.entries(LANGS)) {
  try {
    const html = TEMPLATE.replace(/{{lang}}/g, code)
      .replace(/{{dir}}/g, lang.dir)
      .replace(/{{title}}/g, lang.title)
      .replace(/{{desc}}/g, lang.desc);
    
    const outDir = path.join(__dirname, 'landing', code); // Use __dirname for robust path
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`Generated: landing/${code}/index.html`);
  } catch (error) {
    console.error(`Error generating page for ${code}:`, error);
  }
}
console.log('Landing page generation complete.');
