// src/js/core/subtitleParser.js

/**
 * Performs a basic validation for SRT format.
 * Checks for a sequence number, timestamp arrow, and a blank line indicating the end of a block.
 * @param {string} text - The subtitle text.
 * @returns {boolean} True if basic SRT structure is detected, false otherwise.
 */
export function isValidSRT(text) {
    if (!text || typeof text !== 'string') return false;
    // Regex looks for:
    // 1. A line with only digits (sequence number)
    // 2. Followed by a line with HH:MM:SS,ms --> HH:MM:SS,ms timestamp format
    // 3. Followed by at least one line of subtitle text
    // This is a simplified check and might not catch all SRT errors.
    const srtBlockRegex = /^\d+\s*[\r\n]+\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}\s*[\r\n]+(.+[\r\n]*)+/m;
    return srtBlockRegex.test(text.trim());
}

/**
 * Performs a basic validation for VTT format.
 * Checks if the text starts with "WEBVTT".
 * @param {string} text - The subtitle text.
 * @returns {boolean} True if "WEBVTT" header is found, false otherwise.
 */
export function isValidVTT(text) {
    if (!text || typeof text !== 'string') return false;
    return text.trim().startsWith("WEBVTT");
}

/**
 * Converts VTT text to an internal SRT-like structure for consistent processing.
 * This is a simplified conversion and might not handle all VTT features.
 * @param {string} vttText - The VTT formatted subtitle text.
 * @returns {string} An SRT-like formatted string.
 * @throws {Error} If the VTT text is missing the WEBVTT header.
 */
export function vttToInternalSrt(vttText) {
    let lines = vttText.split(/\r?\n/);
    if (!lines[0].trim().startsWith("WEBVTT")) {
        // This error message should be localized by the caller if shown to the user.
        throw new Error("Invalid VTT content: Missing WEBVTT header.");
    }

    // Remove WEBVTT header, NOTE, STYLE, and empty lines after header processing.
    // Find the first actual content line (timestamp or cue text)
    let startIndex = 1;
    while (startIndex < lines.length && 
           (lines[startIndex].trim() === "" || 
            lines[startIndex].trim().startsWith("NOTE") || 
            lines[startIndex].trim().startsWith("STYLE") ||
            lines[startIndex].trim().startsWith("REGION"))) {
        startIndex++;
    }
    lines = lines.slice(startIndex);

    let srtString = "";
    let counter = 1;
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (line === "") { // Skip empty lines between cues
            i++;
            continue;
        }

        // Check for cue identifier (optional in VTT, we'll ignore it for SRT conversion)
        // Then check for timestamp line
        let timestampLine = "";
        if (line.includes("-->")) {
            timestampLine = line;
        } else if (i + 1 < lines.length && lines[i+1].trim().includes("-->")) {
            // Cue identifier might be on this line, timestamp on the next
            timestampLine = lines[i+1].trim();
            i++; // Consume the identifier line
        } else {
            i++; // Not a recognized start of a cue, skip
            continue;
        }

        srtString += `${counter}\n`;
        srtString += `${timestampLine.replace(/\./g, ',')}\n`; // VTT uses '.', SRT uses ',' for milliseconds
        i++; // Move past timestamp line

        let textLines = [];
        while (i < lines.length && lines[i].trim() !== "") {
            textLines.push(lines[i]);
            i++;
        }
        srtString += textLines.join("\n") + "\n\n";
        counter++;
        
        // Skip any blank lines after the cue text block
        while (i < lines.length && lines[i].trim() === "") {
            i++;
        }
    }
    return srtString.trim();
}


/**
 * Converts translated SRT-like text back to VTT format if the original was VTT.
 * This is a simplified conversion.
 * @param {string} srtText - The SRT-like formatted text (after translation).
 * @returns {string} A VTT formatted string.
 */
export function internalSrtToVTT(srtText) {
    let vttString = "WEBVTT\n\n"; // VTT Header
    const blocks = srtText.trim().split(/\n\s*\n/); // Split by blank lines, allowing for spaces in between

    blocks.forEach(block => {
        const lines = block.split('\n');
        if (lines.length >= 2) { // Expecting at least sequence (ignored) and timestamp
            // const sequenceNumber = lines[0]; // SRT sequence number, not used in VTT cues directly
            const srtTimestamps = lines[1];
            const vttTimestamps = srtTimestamps.replace(/,/g, '.'); // Convert milliseconds separator
            
            const textContent = lines.slice(2).join('\n');
            
            vttString += `${vttTimestamps}\n`;
            vttString += `${textContent}\n\n`;
        }
    });
    return vttString.trim();
}

/**
 * Replaces Persian/Arabic numerals in a string with Western Arabic numerals (0-9),
 * except for those within SRT timestamp patterns.
 * @param {string} txt - The text to process.
 * @returns {string} The text with numerals converted.
 */
export function fixNumbers(txt) {
    if (!txt || typeof txt !== 'string') return txt;
  // Regex:
  // Group 1: (\d{1,2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2},\d{3}) - Captures full SRT timestamp lines
  // Group 2: (\d+) - Captures standalone sequences of digits (Western Arabic numerals 0-9)
  // Group 3: ([\u06F0-\u06F9\u0660-\u0669]+) - Captures sequences of Persian or Arabic-Indic numerals
  return txt.replace(/(\d{1,2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2},\d{3})|(\d+)|([\u06F0-\u06F9\u0660-\u0669]+)/g, 
    (match, srtTimestamp, westernNumber, nonWesternNumber) => {
    if (srtTimestamp) {
      return srtTimestamp; // Preserve SRT timestamp block as is
    }
    if (westernNumber) {
      return westernNumber; // Preserve existing Western Arabic numerals
    }
    if (nonWesternNumber) {
      return toEnglishNumerals(nonWesternNumber); // Convert Persian/Arabic-Indic numerals
    }
    return match; // Fallback, should not be reached if regex is comprehensive
  });
}

/**
 * Converts a string containing Persian or Arabic-Indic numerals to Western Arabic numerals.
 * @param {string} numStr - The string with Persian/Arabic numerals.
 * @returns {string} The string with numerals converted to Western Arabic.
 */
function toEnglishNumerals(numStr) {
  const persianArabicMap = { 
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', // Persian
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'  // Arabic-Indic
  };
  return numStr.split('').map(char => persianArabicMap[char] || char).join('');
}
