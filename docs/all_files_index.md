# SubMovies – Complete Project File Structure

## Root Directory
- `index.html` — Main web app UI
- `script.js` — Frontend logic, Gemini API integration
- `manifest.json` — PWA configuration
- `sw.js` — Service Worker for offline caching
- `favicon.svg` / `favicon.ico` — App icons
- `robots.txt` / `sitemap.xml` — SEO and crawler config
- `LICENSE` — MIT open-source license
- `README.md` — Main documentation
- `CONTRIBUTING.md` — How to contribute
- `CHANGELOG.md` — Version history and changes

## Multilingual Landing Pages
- `landing.en.html` — English
- `landing.fa.html` — Persian (فارسی)
- `landing.es.html` — Spanish (Español)
- `landing.fr.html` — French (Français)
- `landing.de.html` — German (Deutsch)
- `landing.ru.html` — Russian (Русский)
- `landing.pt.html` — Portuguese (Português)
- `landing.tr.html` — Turkish (Türkçe)
- `landing.ar.html` — Arabic (العربية)
- `landing.hi.html` — Hindi (हिन्दी)
- `landing.zh.html` — Chinese (中文)
- `landing.ja.html` — Japanese (日本語)
- `landing.ko.html` — Korean (한국어)

## Language Flag Icons (SVG)
- `flags/en.svg` — 🇺🇸 English
- `flags/fa.svg` — 🇮🇷 Persian
- `flags/es.svg` — 🇪🇸 Spanish
- `flags/fr.svg` — 🇫🇷 French
- `flags/de.svg` — 🇩🇪 German
- `flags/ru.svg` — 🇷🇺 Russian
- `flags/pt.svg` — 🇵🇹 Portuguese
- `flags/tr.svg` — 🇹🇷 Turkish
- `flags/ar.svg` — 🇸🇦 Arabic
- `flags/hi.svg` — 🇮🇳 Hindi
- `flags/zh.svg` — 🇨🇳 Chinese
- `flags/ja.svg` — 🇯🇵 Japanese
- `flags/ko.svg` — 🇰🇷 Korean

## Generators & Automation
- `generate.js` — Node.js script to generate landing pages
- `.github/workflows/auto-generate.yml` — GitHub Action to auto-build language pages

## Documentation
- `docs/architecture.md` — App architecture & modular structure
- `docs/all_files_index.md` — Full file listing (this structure)

## Features Enabled by Files
- SRT upload + translation
- Gemini model + tone selection
- Offline support (IndexedDB)
- Dark/light mode toggle
- Language dropdown with flags
- Export translated SRT file
- History tracking and shareable links
- Fully installable PWA
