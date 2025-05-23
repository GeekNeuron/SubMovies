const fs = require('fs');
const path = require('path');

const LANGS = {
  en: { name: 'English', native: 'English', dir: 'ltr' },
  fa: { name: 'Persian', native: 'فارسی', dir: 'rtl' },
  es: { name: 'Spanish', native: 'Español', dir: 'ltr' },
  ...
};

const TEMPLATE = fs.readFileSync('./landing.en.html', 'utf8');

for (const [code, lang] of Object.entries(LANGS)) {
  const output = TEMPLATE
    .replace(/<html lang=.*? dir=.*?>/, `<html lang=\"${code}\" dir=\"${lang.dir}\">`)
    .replace(/SubMovies/, `SubMovies`)
    .replace(/Select Page Language/, `${lang.name} (${code}) ${lang.native}`);
  fs.writeFileSync(`landing.${code}.html`, output);
}
