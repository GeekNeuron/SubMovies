# Project Architecture – SubMovies

SubMovies is a pure frontend project with no backend dependencies.

## Folder Structure

```
/lang/               → JSON translations for 13 UI languages
/public/             → icons, manifest, favicon
/docs/architecture.md→ project architecture guide
index.html           → main app entry
script.js            → core logic and Gemini API integration
generate.js          → optional static page generator (not required)
```

## Key Modules

- `index.html`  
  - Defines static UI with placeholders and data-i18n labels

- `script.js`
  - Handles:
    - language selection (localStorage + browser detect)
    - Gemini API calls
    - UI population and translation
    - tone/split options
    - toast notifications
    - compare results layout

- `lang/*.json`
  - Localized UI texts per language

## Deployment

App runs directly via GitHub Pages:  
[https://geekneuron.github.io/SubMovies](https://geekneuron.github.io/SubMovies)

No build process is required.

## Privacy

All translation happens client-side. No subtitle data or API keys are sent to any server other than Gemini's official API.
