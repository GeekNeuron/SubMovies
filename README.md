# SubMovies – Gemini Subtitle Translator

[![GitHub Pages](https://img.shields.io/badge/demo-live-blue?logo=github)](https://geekneuron.github.io/SubMovies)

Translate SRT subtitle files into 13 global languages using **Gemini AI** with custom tone, formatting, and full client-side privacy. Built for accessibility, precision, and open-source community.

## [Live Demo →](https://geekneuron.github.io/SubMovies)

---

## Features

- **Gemini API** powered subtitle translation
- **13 Language UI support** with dynamic switcher
- **Custom tone selection**: Formal, Literary, Casual, etc.
- **Single / Multi-part translation**
- **Secure client-side API key usage** (no backend)
- **Supports .srt upload and preview**
- **Smart number fixing**, maintains original timestamps
- **RTL layout detection** (Arabic, Persian, etc.)
- **Responsive & dark themed UI**

---

## Usage

1. Paste your [Gemini API key](https://makersuite.google.com/app/apikey)
2. Choose translation model (free or paid)
3. Paste subtitle text or upload `.srt` file
4. Choose tone and formatting
5. Translate and copy/download result

> No data leaves your browser. Everything runs on your device.

---

## Installation

```bash
git clone https://github.com/GeekNeuron/SubMovies.git
cd SubMovies
npm install  # (optional, for dev tooling)
```

### Development / Build
No build needed – it's static.
But to (re)generate landing pages:
```bash
node generate.js
```

---

## Languages Supported

UI is available in:
- English (en)
- فارسی (fa)
- Español (es)
- Français (fr)
- Deutsch (de)
- Русский (ru)
- Português (pt)
- Türkçe (tr)
- العربية (ar)
- हिन्दी (hi)
- 中文 (zh)
- 日本語 (ja)
- 한국어 (ko)

Translation target is based on selected UI language.

---

## Contributing

Pull requests are welcome!

1. Fork project
2. Add/improve language files in `/lang`
3. Open PR with explanation

---

## Support & Donate
If you find this tool helpful, consider ⭐️ starring the repo or [buying a coffee](https://buymeacoffee.com/geekneuron)

---

## License

MIT © GeekNeuron
