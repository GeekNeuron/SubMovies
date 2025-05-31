<!DOCTYPE html>
<html lang="fa" dir="rtl"> <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title data-i18n="appTitle">مترجم زیرنویس جمینای</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body {
      --body-bg: #f3f4f6; 
      --text-color-primary: #1f2937; 
      --container-bg: #ffffff; 
      --input-bg: #f9fafb; 
      --input-border: #d1d5db; 
      --input-text: #111827; 
      --button-bg: #3b82f6; 
      --button-text: #ffffff;
      --button-hover-bg: #2563eb; 
      --select-bg: #e5e7eb; 
      --select-text: #111827; 
      --select-border: #9ca3af; 
      --theme-toggle-icon-color: #4b5563; 
      transition: background-color 0.3s, color 0.3s;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    body.dark-theme {
      --body-bg: #0d1117;
      --text-color-primary: #c9d1d9;
      --container-bg: #161b22;
      --input-bg: #374151; 
      --input-border: #4b5563; 
      --input-text: #f3f4f6; 
      --button-bg: #3282b8;
      --button-text: #ffffff;
      --button-hover-bg: #1d4357;
      --select-bg: #374151; 
      --select-text: #f3f4f6; 
      --select-border: #6b7280; 
      --theme-toggle-icon-color: #9ca3af; 
    }
    body { background-color: var(--body-bg); color: var(--text-color-primary); }
    #formContainer, #responseContainer > div#response { background-color: var(--container-bg); }
    input[type="password"], input[type="text"], textarea, select {
      background-color: var(--input-bg); border-color: var(--input-border); color: var(--input-text);
    }
    button#sendBtn, button#downloadBtn {
       background-color: var(--button-bg) !important; color: var(--button-text) !important;
    }
     button#sendBtn:hover, button#downloadBtn:hover {
       background-color: var(--button-hover-bg) !important;
    }
    select#lang, select#model, select#tone, select#langTarget {
        background-color: var(--select-bg); color: var(--select-text); border-color: var(--select-border);
    }
    .theme-toggle-button {
      background: none; border: none; color: var(--theme-toggle-icon-color); cursor: pointer;
      font-size: 1.5rem; padding: 0.5rem; line-height: 1; opacity: 0.7;
    }
    .theme-toggle-button:hover { opacity: 1; }
    .sun-icon { display: inline; } .moon-icon { display: none; }  
    body.dark-theme .sun-icon { display: none; } body.dark-theme .moon-icon { display: inline; } 
    html[lang="fa"] body, html[lang="fa"] input, html[lang="fa"] textarea, html[lang="fa"] select,
    html[lang="fa"] button, html[lang="fa"] #appTitleH1, html[lang="fa"] label, html[lang="fa"] p,
    html[lang="fa"] div#fileNameText, html[lang="fa"] h2#responseTitle, html[lang="fa"] #response pre {
      font-family: "Vazirmatn", sans-serif;
    }
  </style>
  <script defer src="script.js?v=final_v8"></script> </head>
<body>

  <div class="max-w-2xl mx-auto">
    <div class="text-right mb-4">
      <select id="lang" class="p-2 rounded border">
        <option value="fa">فارسی (fa)</option>
        <option value="en">English (en)</option>
      </select>
    </div>

    <div id="formContainer" class="p-6 rounded-2xl shadow-xl">
      <div class="flex justify-between items-center mb-4">
        <h1 id="appTitleH1" class="text-2xl font-bold" data-i18n="appTitleH1"></h1>
        <button id="themeToggleBtn" class="theme-toggle-button">
          <span class="sun-icon">☀️</span>
          <span class="moon-icon">🌙</span>
        </button>
      </div>

      <label for="apiKey" class="block mb-2 text-sm font-medium" data-i18n="apiKeyLabel"></label>
      <input id="apiKey" type="password" class="w-full p-2 mb-4 rounded border" data-i18n-placeholder="apiKeyPlaceholder" />
      
      <label for="model" class="block mb-2 text-sm font-medium" data-i18n="modelLabel"></label>
      <select id="model" class="w-full p-2 mb-4 rounded border">
        <option value="gemini-2.5-pro-latest">Gemini 2.5 Pro</option> 
        <option value="gemini-2.5-flash-latest">Gemini 2.5 Flash</option> 
        <option value="gemini-2.0-flash-latest">Gemini 2.0 Flash</option> 
        <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
        <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
        <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
      </select>
      <p class="text-xs mb-3" data-i18n="modelInfo" style="color: var(--text-color-primary); opacity: 0.7;"></p>

      <label for="tone" class="block mb-2 text-sm font-medium" data-i18n="toneLabel"></label>
      <select id="tone" class="w-full p-2 mb-4 rounded border"></select>

      <label for="langTarget" class="block mb-2 text-sm font-medium" data-i18n="langTargetLabel"></label>
      <select id="langTarget" class="w-full mb-4 p-2 rounded border">
        <option value="en">English (en)</option>
        <option value="fa">فارسی (fa)</option>
        <option value="es">Español (es)</option>
        <option value="fr">Français (fr)</option>
        <option value="de">Deutsch (de)</option>
        <option value="ru">Русский (ru)</option>
        <option value="zh">中文 (zh)</option>
        <option value="ja">日本語 (ja)</option>
        <option value="ko">한국어 (ko)</option>
        <option value="ar">العربية (ar)</option>
        <option value="hi">हिन्दी (hi)</option>
        <option value="tr">Türkçe (tr)</option>
        <option value="pt">Português (pt)</option>
        <option value="it">Italiano (it)</option>
      </select>
      
      <label id="fileInputLabel" for="fileInput" class="block mb-2 text-sm font-medium" data-i18n="fileChooseLabel"></label>
      <input id="fileInput" type="file" accept=".srt" class="mb-1 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:text-sm file:font-medium hover:file:opacity-80 cursor-pointer" style="color: var(--text-color-primary)"/>
      <div id="fileNameText" class="text-xs mb-4 h-4" data-i18n="fileNone" style="color: var(--text-color-primary); opacity: 0.7;"></div>

      <textarea id="prompt" class="w-full h-48 p-2 rounded border" data-i18n-placeholder="promptPlaceholder"></textarea>

      <label for="filenameInput" class="block mb-2 text-sm font-medium" data-i18n="filenameLabel"></label>
      <input id="filenameInput" type="text" class="w-full p-2 mb-4 rounded border" data-i18n-placeholder="filenamePlaceholder" />
      
      <button id="sendBtn" class="w-full py-2 rounded font-semibold mb-2" data-i18n="translateBtn"></button>
      <button id="downloadBtn" style="display:none" class="w-full py-2 rounded font-semibold" data-i18n="downloadBtn"></button>
    </div>

    <div id="responseContainer" class="mt-6" style="display:none;">
      <h2 id="responseTitle" class="text-xl font-semibold mb-2" data-i18n="responseTitle"></h2>
      <div id="response" class="w-full text-sm whitespace-pre-wrap p-4 rounded shadow-md"></div>
    </div>

    <footer class="text-center text-xs mt-10" style="color: var(--text-color-primary); opacity: 0.6;">
      <p><span data-i18n="footerMadeWith"></span> ❤️ <span data-i18n="footerBy"></span> <a href="https://github.com/GeekNeuron/SubMovies" class="underline" data-i18n="footerAuthor">GeekNeuron</a></p>
    </footer>
  </div>
</body>
</html>
