# Contributing to SubMovies

We welcome all contributions to improve SubMovies, including:

- Language translations (`/lang`)
- UI enhancements
- Gemini model updates
- Bug fixes and suggestions

## Getting Started

1. Fork the repository
2. Clone it:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SubMovies.git
   cd SubMovies
   ```
3. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Adding a New Language

1. Copy `lang/en.json` → `lang/xx.json`
2. Translate all keys
3. Add the language to the dropdown in `index.html`
4. Test your translation

## Submitting a Pull Request

- Ensure your branch is up to date:
  ```bash
  git pull origin main --rebase
  ```
- Commit your changes:
  ```bash
  git commit -m "Add new translation: XX"
  git push origin feature/your-feature-name
  ```
- Open a Pull Request and describe your changes

Thanks for contributing!
