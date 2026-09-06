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
 * Parses subtitle text (SRT or VTT, auto-detected) into a structured array
 * of cue blocks. Used by the manual translation editor to render one row
 * per subtitle line. Timestamps are always normalized to SRT's comma-decimal
 * format, regardless of the source format.
 * @param {string} text - Raw subtitle text (SRT or VTT).
 * @returns {Array<{index: string, timestamp: string, originalText: string}>}
 */
export function parseSubtitleBlocks(text) {
    if (!text || typeof text !== 'string') return [];

    let srtText = text.trim();
    if (isValidVTT(srtText)) {
        try {
            srtText = vttToInternalSrt(srtText);
        } catch (e) {
            // Malformed VTT header; fall through and try parsing as-is.
        }
    }

    const rawBlocks = srtText.split(/\r?\n\s*\r?\n/).filter(b => b.trim() !== '');
    const blocks = [];

    for (const raw of rawBlocks) {
        const lines = raw.split(/\r?\n/);
        if (lines.length < 2) continue;

        const idxLine = lines[0].trim();
        const timeLine = lines[1].trim();
        if (!timeLine.includes('-->')) continue; // Not a recognizable cue block; skip.

        const textLines = lines.slice(2);
        blocks.push({
            index: idxLine || String(blocks.length + 1),
            timestamp: timeLine,
            originalText: textLines.join('\n').trim(),
        });
    }

    return blocks;
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

/**
 * Detects whether text looks like an ASS/SSA subtitle file.
 * @param {string} text
 * @returns {boolean}
 */
export function isValidASS(text) {
    if (!text) return false;
    return /\[Script Info\]/i.test(text) && /\[Events\]/i.test(text) && /^Dialogue:/im.test(text);
}

/**
 * Parses an ASS/SSA file, extracting only the Dialogue events' Text field
 * (the last field per the format's own "Format:" line - since Text is
 * always last, this is safe even though the text itself may contain commas).
 * Everything else (styles, script info, timing, effects, Comment lines) is
 * kept completely untouched, referenced by line index for reconstruction.
 * @param {string} text
 * @returns {{lines: string[], events: {lineIndex: number, originalText: string}[], numFields: number}}
 */
export function parseASS(text) {
    const lines = text.split(/\r?\n/);
    let numFields = 10; // sane default matching the standard v4+ "Format:" line
    let inEvents = false;
    const events = [];

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (/^\[.+\]/.test(trimmed)) {
            inEvents = /^\[Events\]/i.test(trimmed);
            return;
        }
        if (!inEvents) return;

        if (/^Format:/i.test(trimmed)) {
            numFields = trimmed.replace(/^Format:/i, '').split(',').length;
            return;
        }
        if (/^Dialogue:/i.test(trimmed)) {
            const colonIdx = line.indexOf(':');
            const rest = line.slice(colonIdx + 1);
            const parts = rest.split(',');
            if (parts.length >= numFields) {
                const originalText = parts.slice(numFields - 1).join(',');
                events.push({ lineIndex: idx, originalText });
            }
        }
    });

    return { lines, events, numFields };
}

/**
 * Rebuilds a full ASS/SSA file from a parsed structure and a list of
 * translated texts (same order as `parsed.events`). Any event without a
 * corresponding translated text (e.g. a partially-completed translation)
 * keeps its original text, so a partial download is always a valid file.
 * @param {{lines: string[], events: {lineIndex:number, originalText:string}[], numFields: number}} parsed
 * @param {string[]} translatedTexts
 * @returns {string}
 */
export function rebuildASS(parsed, translatedTexts) {
    const lines = parsed.lines.slice();
    parsed.events.forEach((ev, i) => {
        const newText = (translatedTexts[i] !== undefined && translatedTexts[i] !== null) ? translatedTexts[i] : ev.originalText;
        const line = lines[ev.lineIndex];
        const colonIdx = line.indexOf(':');
        const prefix = line.slice(0, colonIdx + 1);
        const rest = line.slice(colonIdx + 1);
        const parts = rest.split(',');
        const fixedParts = parts.slice(0, parsed.numFields - 1);
        lines[ev.lineIndex] = `${prefix}${fixedParts.join(',')},${newText}`;
    });
    return lines.join('\n');
}

/**
 * Converts a parsed ASS structure's dialogue events into an internal
 * SRT-like representation so the existing chunking/translation/resume/
 * continuity pipeline (built for SRT/VTT) can be reused unchanged. The
 * timestamps used here are placeholders (not real ASS timing) purely to
 * satisfy the pipeline's block-parsing format - they are discarded, never
 * shown to the user, and never written to the final output.
 * @param {{events: {originalText: string}[]}} parsed
 * @returns {string}
 */
export function assEventsToInternalSrt(parsed) {
    return parsed.events
        .map((ev, i) => `${i + 1}\n00:00:00,000 --> 00:00:00,000\n${ev.originalText}`)
        .join('\n\n');
}

/**
 * Re-wraps a block of text into lines of at most maxCharsPerLine characters,
 * breaking only at spaces (never mid-word).
 * @param {string} text
 * @param {number} maxCharsPerLine
 * @returns {string}
 */
export function wrapText(text, maxCharsPerLine = 42) {
    const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length === 0) return '';
    const lines = [];
    let current = '';
    for (const w of words) {
        const candidate = current ? `${current} ${w}` : w;
        if (candidate.length > maxCharsPerLine && current) {
            lines.push(current);
            current = w;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines.join('\n');
}

/**
 * Post-processes a full block of translated SRT-like text: re-wraps each
 * cue's dialogue text (only the lines AFTER the index/timestamp) so no
 * single line exceeds maxCharsPerLine, for better subtitle readability.
 * Index and timestamp lines are always left untouched.
 * @param {string} text - joined SRT-like text (multiple "index\ntimestamp\ntext" blocks).
 * @param {number} maxCharsPerLine
 * @returns {string}
 */
export function postProcessLineWrapping(text, maxCharsPerLine = 42) {
    if (!text) return text;
    const blocks = text.split(/\r?\n\s*\r?\n/).filter(b => b.trim() !== '');
    const processed = blocks.map(block => {
        const lines = block.split(/\r?\n/);
        if (lines.length < 3 || !lines[1].includes('-->')) return block; // not a normal cue block; leave as-is
        const meta = lines.slice(0, 2);
        const dialogue = lines.slice(2).join(' ');
        const wrapped = wrapText(dialogue, maxCharsPerLine);
        return [...meta, wrapped].join('\n');
    });
    return processed.join('\n\n');
}
