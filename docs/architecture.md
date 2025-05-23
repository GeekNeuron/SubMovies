# SubMovies – Architecture Overview

## 1. Overview
SubMovies is a browser-based subtitle translator powered by Gemini API with offline capability (PWA), custom tone options, and multilingual landing pages.

---

## 2. Technology Stack
| Layer        | Tool/Language              |
|--------------|-----------------------------|
| UI           | HTML5, Tailwind CSS        |
| Logic/API    | Vanilla JavaScript (ES6)   |
| Translation  | Google Gemini API (REST)   |
| Caching      | IndexedDB                  |
| Automation   | Node.js (generate.js)      |
| Hosting      | GitHub Pages               |

---

## 3. Folder Structure
```
SubMovies/
├── index.html           # main UI
├── script.js            # frontend logic
├── manifest.json / sw.js     # PWA
├── landing/{lang}/index.html # multilingual landing pages
├── flags/               # language flag icons
├── docs/architecture.md # this file
├── generate.js          # CLI page generator
├── .github/workflows/   # GitHub Actions
```

---

## 4. Core Components
### /index.html
- Loads UI, model selector, tone dropdown
- Uploads SRT or paste text

### /script.js
- Binds UI
- Prepares prompt for Gemini
- Displays translated subtitles side-by-side
- Fixes number formats
- Saves prompt to IndexedDB

### /generate.js
- Auto-creates 13 language landing pages in `/landing/{lang}/index.html`

### /sw.js + manifest.json
- Offline PWA installation

### /docs/
- Internal architecture, file listing

---

## 5. Translation Workflow
1. User pastes/upload subtitle
2. Chooses Gemini model + tone
3. JS sends prompt to Gemini API
4. Receives and formats result
5. Compares side-by-side
6. Saves locally

---

## 6. Gemini API Endpoint
```txt
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=YOUR_API_KEY
```
Payload:
```json
{
  "contents": [{ "parts": [{ "text": "your prompt here" }] }]
}
```

---

## 7. Localization
- Each `/landing/{lang}/index.html` is auto-generated
- SEO-friendly URLs
- Translated UI intro

---

## 8. Deployment
- Hosted via GitHub Pages
- SEO: `robots.txt`, `sitemap.xml`
- Actions auto-generate translated pages on push

---

## 9. To Do / Ideas
- Add language switcher in header
- Add Google Analytics or Vercel analytics
- Add keyboard shortcuts
- Enable image-to-text with gemini-pro-vision
