# 🌌 SubMovies - Your Galactic Subtitle Translator 🚀

[![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/SubMovies/YOUR_WORKFLOW_FILE.yml?branch=main&style=for-the-badge)](https://github.com/YOUR_USERNAME/SubMovies/actions) [![MIT License](https://img.shields.io/github/license/GeekNeuron/SubMovies?style=for-the-badge)](LICENSE) [![Latest Release](https://img.shields.io/github/v/release/GeekNeuron/SubMovies?style=for-the-badge)](https://github.com/GeekNeuron/SubMovies/releases) [![Live Demo](https://img.shields.io/badge/Live_Demo-View_Now-brightgreen?style=for-the-badge&logo=githubpages)](https://geekneuron.github.io/SubMovies/)

**SubMovies** is a powerful and modern tool for translating subtitle files using Google's advanced Gemini AI. This project is designed with a focus on a smooth user experience, high accuracy, and user privacy (fully client-side processing). Take your subtitles to a new galaxy of languages!

---

## ✨ Key Features

* **Gemini AI Powered Translation:** Leverages the latest Gemini models (including the 2.5 Pro and Flash series) for accurate and natural-sounding translations.
* **Modern & Responsive UI:** Designed with Tailwind CSS and CSS variables for a fantastic visual experience across all devices.
* **SRT & VTT Format Support:** Upload, translate, and download subtitle files in both common formats.
* **Multilingual UI:** User interface available in English and Persian (easily expandable).
* **Advanced Translation Settings:**
    * AI Model Selection (clearly indicating Free Tier*/Paid).
    * Translation Tone Adjustment (Formal, Casual, Literary, etc.).
    * Model Creativity Control (Temperature) for more precise or imaginative results.
* **Client-Side Processing:** All translation operations and API key management happen in your browser; no data is sent to our servers.
* **Secure API Key Storage (Optional):** Option to save your API key in local browser storage with clear security warnings.
* **Side-by-Side Comparison:** View original and translated text concurrently for easy review.
* **Useful Utilities:**
    * Input text character counter with warnings for very long texts.
    * Basic format validation for SRT and VTT files.
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
|   |   |-- main.js                # Main JS entry point, app initialization
|   |   |-- core/                  # Core modules and services
|   |   |   |-- apiService.js      # Logic for all Gemini API communications
|   |   |   |-- i18nService.js     # Language loading and translation application
|   |   |   |-- themeService.js    # Dark/Light theme management
|   |   |   |-- subtitleParser.js  # SRT/VTT parsing and validation functions
|   |   |   |-- toastService.js    # Toast notification display logic
|   |   |-- ui/                    # UI related modules
|   |   |   |-- domElements.js     # DOM element selectors
|   |   |   |-- settingsController.js # Manages settings (API key, model, tone, creativity)
|   |   |   |-- fileController.js    # Manages file upload, name display, char count
|   |   |   |-- translationController.js # Manages display of original/translated text, download/copy
|   |   |-- utils/                 # General utility functions
|   |       |-- helpers.js         # Miscellaneous helper functions
|   |-- css/                       # CSS styles
|   |   |-- main.css               # General styles and theme CSS variables
|   |-- lang/                      # JSON translation files
|   |   |-- en.json
|   |   |-- fa.json
|   |-- assets/                    # Other static assets (e.g., UI icons)
|
|-- service-worker.js              # Service worker for PWA functionality
|
|-- scripts/                       # Helper Node.js scripts
|   |-- generate-landing-pages.js
|
|-- .github/
|   |-- workflows/
|       |-- auto-generate-landing-pages.yml
|
|-- docs/                          # Project documentation
|
|-- landing/                       # Auto-generated landing pages
|
README.md
CONTRIBUTING.md
CHANGELOG.md
LICENSE
.gitignore
```

---

## 🛠️ Technology Stack

* **HTML5**
* **CSS3** (with [Tailwind CSS](https://tailwindcss.com/) for rapid styling and CSS Variables for theming)
* **JavaScript (ES6+ Modules)** (Vanilla JS, no framework)
* **Google Gemini API** (via `generativelanguage.googleapis.com`)
* **Google Fonts** (for Vazirmatn font in Persian UI)

---

## 🚀 Quick Start & Usage

1.  Visit the [**SubMovies Live Demo**](https://geekneuron.github.io/SubMovies/).
2.  Obtain your **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey) and enter it into the designated field.
    * You can enable the "Save API Key" option for convenience in future visits (be aware of browser storage security implications).
3.  Select your preferred **AI Model,** **Translation Tone,** **Target Language,** and **Creativity Level (Temperature).**
4.  **Upload** your subtitle file (`.srt` or `.vtt`) or **paste** its content directly into the text area.
5.  Choose a name for your output file.
6.  Click the **"Translate Subtitles"** button.
7.  Compare the original and translated text side-by-side once the translation is complete.
8.  Use the **"Copy"** button to copy the translated text or **"Download Translated File"** to get the file.

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
