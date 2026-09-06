# Contributing to SubMovies

Thanks for your interest in improving SubMovies! This is a fully client-side project (no backend, no build step), which keeps contributing simple.

## Getting Started

1. Fork and clone the repository.
2. Since the app uses ES modules (`type="module"`) and `fetch()` to load language files, you can't just open `index.html` from disk (`file://`) - run a local static server from the project root, for example:
   ```bash
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000/index.html`.
3. Make your changes and test them in the browser.

## Project Structure

See [`docs/architecture.md`](docs/architecture.md) for a full breakdown of the folder structure and what each module does.

## Adding or Editing UI Text

All UI strings live in `src/lang/*.json`, one file per language, and are generated from a single shared table in `scripts/build_lang_files.py` to keep every language's key set in sync. To add or change a string:

1. Edit `src/lang/fa.json` directly (it's the hand-maintained reference file), **and**
2. Add the same key to every language's entry in `scripts/build_lang_files.py`, then run:
   ```bash
   python3 scripts/build_lang_files.py
   ```
   This regenerates all 13 `src/lang/*.json` files. Don't hand-edit the other 12 language files directly - your changes will be overwritten next time the script runs.

If you don't have a translation for a new key in every language, use a reasonable placeholder and note it in your pull request so a native speaker can review it.

## Adding a New AI Provider

1. Add the provider to `src/js/utils/providers.js` (an entry in `PROVIDERS`, its display name, and a prefix rule in `getProviderForModel`).
2. Add a `sendTo<Provider>API(...)` function in `src/js/core/apiService.js` following the existing pattern (Gemini/DeepSeek/Claude), and wire it into `sendTranslationRequest`'s dispatcher.
3. Add a localStorage key for that provider's API key in `src/js/utils/constants.js`, and wire it into `getApiKeyStorageKeyForProvider` in `src/js/ui/settingsController.js`.
4. Add the provider's model(s) to the `models` object in every language file (via the build script - see above).
5. **Before opening a PR**, check whether the provider's API actually supports being called directly from a browser (CORS). This app has no backend, so a provider that doesn't allow direct browser requests can't be integrated without adding one - which is out of scope for this project.

## Testing Your Changes

There's no automated test suite; please manually verify in a browser:
- The feature you changed, in at least one RTL language (e.g. Persian or Arabic) and one LTR language (e.g. English), since layout and text direction are handled dynamically.
- That `index.html`'s `<div>` tags remain balanced and correctly nested if you touched the markup (a quick way to check: count matching `<div`/`</div>` and make sure nesting order round-trips).
- That existing features (AI translation, manual mode, all three providers if applicable) still work after your change.

## Reporting Issues

Please include:
- Steps to reproduce
- Browser and OS
- Whether you were using AI translation or Manual mode, and which provider/model if relevant

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
