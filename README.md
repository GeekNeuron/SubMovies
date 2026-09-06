# 🌌 SubMovies - Your Galactic Subtitle Translator 🚀

[![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/SubMovies/YOUR_WORKFLOW_FILE.yml?branch=main&style=for-the-badge)](https://github.com/YOUR_USERNAME/SubMovies/actions) [![MIT License](https://img.shields.io/github/license/GeekNeuron/SubMovies?style=for-the-badge)](LICENSE) [![Latest Release](https://img.shields.io/github/v/release/GeekNeuron/SubMovies?style=for-the-badge)](https://github.com/GeekNeuron/SubMovies/releases) [![Live Demo](https://img.shields.io/badge/Live_Demo-View_Now-brightgreen?style=for-the-badge&logo=githubpages)](https://geekneuron.github.io/SubMovies/)

**SubMovies** is a powerful and modern tool for translating subtitle files into the language of your choice, using your pick of **Google Gemini**, **DeepSeek**, or **Anthropic Claude**. This project is designed with a focus on a smooth user experience, high accuracy, and user privacy (fully client-side processing - no backend server at all).

The interface is available in 13 languages (Persian, English, Arabic, Turkish, French, German, Spanish, Russian, Chinese, Hindi, Japanese, Portuguese, Italian), auto-detected from your browser and switchable anytime via the 🌐 button. The subtitle **target language** is chosen independently from the UI language via its own selector.

---

## ✨ Key Features

* **Three AI Providers, Your Choice of Key:** Translate with Google Gemini, DeepSeek, or Anthropic Claude. Each provider's API key is stored separately, so switching models never overwrites another provider's saved key.
* **Manual Translation Mode (no AI at all):** Toggle to a line-by-line editor - original text on one side, an empty field for your own translation on the other, matched to each subtitle's timing. Every keystroke is saved automatically, so a reload never loses your work. Export a clean SRT when you're done.
* **Resumable Translations:** If a chunk fails (rate limit, network blip, etc.) or you hit Stop, nothing already translated is thrown away. A "Resume Translation" button picks up exactly where it left off.
* **Cross-Chunk Consistency:** Each new chunk gets a short excerpt of how the immediately preceding part was translated, so character names/terminology/tone stay consistent across a long subtitle file instead of drifting between independently-translated chunks.
* **Configurable Chunk Size:** Choose how many subtitle lines are sent per API request (Optimal/High/Very High) - trade off request count against desync risk.
* **Optional Custom Instructions:** Add your own free-form guidance (e.g. "don't translate character names", "use a playful tone") that gets applied on top of the tone/style settings.
* **Modern & Responsive UI:** Designed with Tailwind CSS and CSS variables for a fantastic visual experience across all devices.
* **SRT & VTT Format Support:** Upload, translate, and download subtitle files in both common formats.
* **Multilingual UI:** Interface available in 13 languages, auto-detected from your browser (switchable anytime via the 🌐 button).
* **Selectable Target Language:** Choose which language your subtitles get translated into, independent of the UI language.
* **Advanced Translation Settings:**
    * AI Model Selection across all three providers (clearly indicating relative cost/speed).
    * Translation Tone Adjustment (Formal, Casual, Literary, etc.).
    * Model Creativity Control (Temperature) for more precise or imaginative results.
* **Client-Side Processing:** All translation operations and API key management happen in your browser; no data is sent to any server other than the AI provider you chose.
* **Secure, Per-Provider API Key Storage (Optional):** Option to save each provider's API key in local browser storage with clear security warnings.
* **Side-by-Side Comparison:** View original and translated text concurrently for easy review, with a live progress bar during translation.
* **Useful Utilities:**
    * Input text character counter with warnings for very long texts.
    * Basic format validation for SRT and VTT files.
    * Custom output filename.
    * "Copy to Clipboard" button for translated text.
* **Dark & Light Theme:** With user preference saving.
* **Professional Project Structure:** Modular, scalable, and ready for future development.
* **Open Source:** Licensed under the MIT License.

---

## 📁 Project Structure (Professional & Galactic)
```
/ (Project Root)
|
|-- index.html                     # Main application entry point
|-- manifest.json                  # PWA configuration
|-- robots.txt                     # For search engines
|-- sitemap.xml                    # Sitemap (can be auto-generated)
|-- favicon.svg                    # Site icon
|-- favicon.ico                    # Site icon
|
|-- src/                           # Main application source code
|   |-- js/                        # JavaScript code
|   |   |-- main.js                # Main JS entry point, app init, translation session/resume logic
|   |   |-- core/                  # Core modules and services
|   |   |   |-- apiService.js      # Gemini/DeepSeek/Claude API calls + shared prompt builder
|   |   |   |-- i18nService.js     # Language loading and translation application
|   |   |   |-- themeService.js    # Dark/Light theme management
|   |   |   |-- subtitleParser.js  # SRT/VTT parsing, validation, and block extraction
|   |   |   |-- toastService.js    # Toast notification display logic
|   |   |-- ui/                    # UI related modules
|   |   |   |-- domElements.js     # DOM element selectors
|   |   |   |-- settingsController.js # Manages settings (API keys per provider, model, tone, chunk size, etc.)
|   |   |   |-- fileController.js    # Manages file upload, name display, char count
|   |   |   |-- translationController.js # Display of original/translated text, progress bar, download/copy
|   |   |   |-- manualEditorController.js # No-AI manual line-by-line translation editor
|   |   |   |-- modalController.js   # Shared selection modal (model/tone/language/chunk size)
|   |   |-- utils/                 # General utility functions
|   |       |-- constants.js       # LocalStorage keys and defaults
|   |       |-- helpers.js         # debounce, file download, filename sanitizing
|   |       |-- languages.js       # Supported UI/target languages (code, native name, RTL flag)
|   |       |-- providers.js       # AI provider metadata (Gemini/DeepSeek/Claude) and model->provider mapping
|   |-- css/                       # CSS styles
|   |   |-- main.css               # General styles and theme CSS variables
|   |   |-- tailwind.min.css       # Local Tailwind build (no external CDN dependency)
|   |-- lang/                      # JSON translation files (13 languages)
|   |   |-- fa.json, en.json, ar.json, tr.json, fr.json, de.json, es.json,
|   |   |-- ru.json, zh.json, hi.json, ja.json, pt.json, it.json
|   |-- assets/                    # Other static assets (e.g., UI icons)
|
|-- service-worker.js              # Service worker for PWA functionality
|
|-- scripts/                       # Helper Node.js/Python scripts
|   |-- generate-landing-pages.js
|   |-- build_lang_files.py        # Generates src/lang/*.json from a shared translation table
|
|-- docs/                          # Project documentation
|   |-- architecture.md
|
README.md
CHANGELOG.md
CONTRIBUTING.md
LICENSE
.gitignore
```

---

## 🛠️ Technology Stack

* **HTML5**
* **CSS3** (with [Tailwind CSS](https://tailwindcss.com/) for rapid styling and CSS Variables for theming - bundled locally, no external CDN dependency)
* **JavaScript (ES6+ Modules)** (Vanilla JS, no framework)
* **AI Providers (bring your own key):**
    * [Google Gemini API](https://ai.google.dev/gemini-api/docs/models) (via `generativelanguage.googleapis.com`)
    * [DeepSeek API](https://api-docs.deepseek.com/) (via `api.deepseek.com`)
    * [Anthropic Claude API](https://docs.claude.com/) (via `api.anthropic.com`, using Anthropic's documented `anthropic-dangerous-direct-browser-access` header for client-side use)
* **Google Fonts** (for Vazirmatn font in Persian UI)

---

## 🚀 Quick Start & Usage

1.  Visit the [**SubMovies Live Demo**](https://geekneuron.github.io/SubMovies/).
2.  Pick an **AI Model** from the list - this determines which provider's key you'll need:
    * Gemini models → get a key from [Google AI Studio](https://aistudio.google.com/app/apikey)
    * DeepSeek models → get a key from the [DeepSeek Platform](https://platform.deepseek.com/)
    * Claude models → get a key from the [Anthropic Console](https://console.anthropic.com/)
    * Each provider's key is stored separately, so switching models later won't lose the others.
    * You can enable the "Save API Key" option for convenience in future visits (be aware of browser storage security implications).
3.  Select your preferred **Translation Tone,** **Target Language,** **Creativity Level (Temperature),** and optionally add **Custom Instructions** or adjust the **Processing Size Per Step** (chunk size).
4.  **Upload** your subtitle file (`.srt` or `.vtt`) or **paste** its content directly into the text area.
5.  Choose a name for your output file.
6.  Click **"Translate Subtitles."** If a chunk fails partway through (rate limit, network issue), whatever already succeeded is kept and shown - just click **"Resume Translation"** to continue from there.
7.  Compare the original and translated text side-by-side once the translation is complete.
8.  Use the **"Copy"** button to copy the translated text or **"Download Translated File"** to get the file.

Prefer to translate it yourself instead of using AI? Toggle **"Manual Translation Mode"** to get a line-by-line editor (original on one side, an empty field for your translation on the other) with full autosave, then export a clean SRT when you're done.

> **Note on DeepSeek:** unlike Gemini (explicitly built for client-side use) and Claude (which added an official opt-in header for it), it isn't independently confirmed here whether DeepSeek's API allows direct browser calls in every environment. If it doesn't in yours, the DeepSeek option will fail with a network error rather than translating - Gemini and Claude are the more reliably-supported options for this fully client-side app.

---

## 💻 Local Development

To run the project locally or contribute to its development:

1.  Clone the repository:
    ```bash
    git clone [https://github.com/GeekNeuron/SubMovies.git](https://github.com/GeekNeuron/SubMovies.git)
    cd SubMovies
    ```
2.  Open the `index.html` file directly in your browser.
    * To use JavaScript Modules (`type="module"`) correctly, you might need to run a simple local web server (e.g., using the Live Server extension in VS Code or the `python -m http.server` command in your terminal).

---

## 🤝 Contributing

We welcome contributions to improve SubMovies! Please read our [**CONTRIBUTING.md**](CONTRIBUTING.md) guide for details on how to get started.

---

## 📜 Changelog

All notable changes to this project are documented in the [**CHANGELOG.md**](CHANGELOG.md) file.

---

## 📄 License

This project is licensed under the [**MIT License**](LICENSE).

---

## 🙏 Acknowledgements & Author

Crafted with ❤️ by **GeekNeuron**.

If you find this tool useful, please consider supporting the project by ⭐ starring the repository!
