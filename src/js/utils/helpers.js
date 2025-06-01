// src/js/utils/helpers.js

// This file is currently empty as fixNumbers and toEnglishNumerals were moved to subtitleParser.js
// You can add other general utility functions here as your project grows.
// For example, debouncing, throttling, string manipulation, etc.

// Example utility (if needed elsewhere, otherwise keep in subtitleParser)
/*
export function toEnglishNumerals(numStr) {
  const persianArabicMap = { 
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', // Persian
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'  // Arabic-Indic
  };
  return numStr.split('').map(char => persianArabicMap[char] || char).join('');
}
*/

// Constants can also be here or in their own file
// export const CHAR_COUNT_WARNING_THRESHOLD = 15000;
