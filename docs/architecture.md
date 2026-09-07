# Project Architecture – SubMovies

SubMovies is a pure frontend project with no backend dependencies.

## Folder Structure

```
src/lang/               → 13 UI language files (fa, en, ar, tr, fr, de, es, ru, zh, hi, ja, pt, it)
src/css/                → main.css (custom "Screening Room" design system - no framework)
src/js/core/            → apiService (Gemini/DeepSeek/Claude), i18nService, subtitleParser, themeService, toastService
src/js/ui/              → domElements, fileController, modalController, settingsController,
                          translationController, manualEditorController
src/js/utils/           → constants, helpers, languages (shared language metadata), providers (AI provider metadata)
index.html              → main app entry
docs/architecture.md    → project architecture guide
scripts/build_lang_files.py → generates src/lang/*.json from a shared translation table
```

## Key Modules

- `index.html`
  - Defines static UI with placeholders and data-i18n labels. The AI-specific
    settings (API key, model, temperature, tone, target language, custom
    prompt, chunk size) live inside `#aiSettingsSection`, which
    `manualEditorController.js` hides entirely when Manual Translation Mode
    is on.

- `src/js/main.js` (entry point)
  - Owns the AI-translation session/resume state machine: builds subtitle
    chunks, runs them through `apiService.sendTranslationRequest`, keeps
    whatever chunks succeed even if a later one fails or the user clicks
    Stop, and lets the same session be resumed from the first pending chunk.
    Also builds the short cross-chunk "continuity" excerpt passed to each
    subsequent chunk for name/tone consistency.

- `src/js/core/apiService.js`
  - One `sendTo<Provider>API` function per provider (Gemini, DeepSeek,
    Claude), sharing a common `buildTranslationPrompt` (tone, target
    language, custom instructions, continuity context). All three build
    their own request/response shape for their vendor's API.
    `sendTranslationRequest` dispatches to the right one based on the
    selected model ID (see `utils/providers.js`).

- `src/js/utils/providers.js`
  - Maps model ID prefixes to a provider (`gemini`/`deepseek`/`claude`) and
    each provider's display name. Adding a new provider means updating this
    file, `apiService.js`, and `settingsController.js`'s API-key-storage
    lookup (see `CONTRIBUTING.md`).

- `src/js/ui/settingsController.js`
  - Manages all AI settings, including a **separate API key per provider**
    (switching the selected model to a different provider swaps which saved
    key is shown/edited, without touching the others), chunk size, and the
    optional custom prompt.

- `src/js/ui/manualEditorController.js`
  - The no-AI manual translation mode: parses the loaded subtitle into rows
    (via `subtitleParser.parseSubtitleBlocks`), renders an editable
    translation field per row, and persists the mode toggle, the original
    text, and every typed translation to localStorage on every change - so a
    reload never loses in-progress manual work.

- `src/js/ui/translationController.js`
  - UI population/translation, the live progress bar, and download/copy for
    AI-translated output.

- `src/lang/<code>.json`
  - Localized UI text for each supported language. All files share the same
    key set (see `scripts/build_lang_files.py`); adding a language means
    adding an entry to that script's translation table and its code to
    `src/js/utils/languages.js`.

- `src/js/utils/languages.js`
  - Single source of truth for supported languages: code, native display
    name, English name (used in the AI prompt), and RTL flag. Shared by both
    the UI-language switcher and the target-language selector.

## Deployment

App runs directly via GitHub Pages:  
[https://geekneuron.github.io/SubMovies](https://geekneuron.github.io/SubMovies)

No build process is required (the Python build script is a one-time/as-needed
step for maintainers editing UI text, not part of the deployed app).

## Privacy

All translation happens client-side. No subtitle data or API keys are sent
to any server other than whichever AI provider (Gemini, DeepSeek, or Claude)
you selected and provided a key for.
