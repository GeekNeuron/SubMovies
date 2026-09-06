# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Support for **DeepSeek** and **Anthropic Claude** as alternative AI providers alongside Gemini. Each provider's API key is stored and restored independently, so switching models never overwrites another provider's saved key.
- **Manual Translation Mode**: a no-AI, line-by-line editor. Original text is shown read-only on one side; an empty field on the other lets you type your own translation per line, matched to the original timing. Every keystroke, and the mode toggle itself, is saved to localStorage automatically. Exports a clean SRT.
- **Resumable translations**: if a chunk fails (API error, rate limit) or the user clicks Stop, previously-completed chunks are no longer discarded. The translate button becomes "Resume Translation" and continues exactly where it left off.
- **Cross-chunk consistency**: each chunk (after the first) now receives a short excerpt of how the immediately-preceding chunk was translated, so character names/terminology/tone stay consistent across a long file instead of drifting between independently-translated chunks.
- **Configurable chunk size** (Optimal/High/Very High), replacing the previous hardcoded value.
- **Optional custom instructions** field: free-form guidance applied on top of the tone/style settings (e.g. "don't translate character names").
- A live **progress bar** (percentage + "chunk X of Y") during translation, replacing the old chunk-count toast alone.
- **Custom output filename** field, wired into both the AI-translation and manual-mode downloads.
- **Multilingual UI**: 13 languages (Persian, English, Arabic, Turkish, French, German, Spanish, Russian, Chinese, Hindi, Japanese, Portuguese, Italian), auto-detected from the browser and switchable via a 🌐 button, generated from a single shared translation table (`scripts/build_lang_files.py`) to keep all language files' keys in sync.
- **Selectable target language**, independent of the UI language (previously hardcoded to Persian).

### Fixed
- The AI model list contained several Gemini model IDs that Google had already retired (`gemini-1.0-pro`, `gemini-1.5-*`, `gemini-2.0-flash-*`); updated to current models.
- A bidi/RTL rendering bug where SRT timestamps (e.g. `00:00:01,000 --> 00:00:02,000`) displayed visually reversed inside the page's `dir="rtl"` context, both in the comparison view and the raw input textarea.
- `index.html` loaded Tailwind CSS from an external CDN despite a matching local copy already being bundled in the repo - switched to the local file, removing an unnecessary hard dependency on external CDN availability.
- An unclosed `<div>` left the settings-modal markup incorrectly nested inside the page's outer wrapper (invalid HTML, previously masked only by browsers' forgiving parsing).
- A translation that failed partway through (or was stopped) used to discard **all** chunks already translated, including ones already paid for via the API. Now chunks complete before the failure are always kept, shown, and resumable.
- Two CSS variable names (`--input-bg`, `--input-border`, `--input-text`) were missing their `-actual` suffix in one spot, meaning the comparison view's boxes weren't getting their intended theme colors.
- A broken JSDoc comment (missing opening `/**`) in `subtitleParser.js`, introduced during an earlier edit, silently broke every module that imported it.
- File uploads didn't fire an `input` event on the textarea (since `.value` was set programmatically), so other features listening for content changes (like the manual translation editor) couldn't react to them; fixed by dispatching a synthetic `input` event after every file-driven content change, distinguished from real typing via `event.isTrusted`.
- Removed dead/unused code: an orphaned `showTranslatingMessage` import, unused `throttle`/`sanitizeHTML`/`simpleUID` helpers, and unused `isValidSRT`/`isValidVTT` imports in `main.js` (validation already happens in `fileController.js`).

### Changed
- `DEFAULT_TONE` fallback constant changed from an English placeholder value that didn't match any actual tone option, to a real Persian tone value.
- Toast notifications moved from the top to the bottom of the viewport, so they no longer cover the API key/model fields.
- The character-count display's alignment now follows text direction, instead of being hardcoded to the right (which only made sense for the original Persian-only UI).

### Known limitations
- DeepSeek's direct-browser-call (CORS) support could not be independently verified from the development environment used for this project; if it doesn't allow it, translations using DeepSeek models will fail with a network error rather than a translation error. Gemini and Claude's client-side support is documented by their respective vendors.
- No ASS/SSA subtitle format support (SRT/VTT only).
- No terminology glossary building or post-processing (e.g. automatic line-length fixing) beyond the lightweight cross-chunk continuity notes described above.
