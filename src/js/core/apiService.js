// src/js/core/apiService.js
import { getCurrentTranslations } from './i18nService.js';

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

/**
 * Sends the subtitle text to the Gemini API for translation.
 * @param {string} textToTranslate - The subtitle text (SRT-like format).
 * @param {string} apiKey - The user's Gemini API key.
 * @param {string} model - The selected Gemini model ID.
 * @param {string} tone - The desired translation tone.
 * @param {string} targetLang - The target language code (e.g., 'en', 'fa').
 * @param {number} temperature - The creativity level for the model.
 * @returns {Promise<string>} The translated subtitle text.
 * @throws {Error} If the API request fails or returns an error.
 */
export async function sendToGeminiAPI(textToTranslate, apiKey, model, tone, targetLang, temperature) {
    const t = getCurrentTranslations(); // For error messages

    const apiUrl = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;

    // Construct a detailed prompt for better results
    const prompt = `
Translate the following subtitles, currently in an SRT-like format, into ${targetLang}.
Maintain the original SRT formatting meticulously: sequence numbers, timestamps (e.g., "00:00:20,123 --> 00:00:22,456"), and all line breaks must be preserved exactly as in the original.
Apply a ${tone} tone to the translated dialogue portions only.
Ensure that any numbers appearing within the dialogue (e.g., "10 dollars", "Chapter 5"), which are NOT part of the SRT timestamps, are also appropriately translated or localized for the ${targetLang} language.
Do NOT add any extra explanations, comments, or any text whatsoever beyond the translated subtitle content itself. The output must be only the translated SRT.

Original Subtitles:
${textToTranslate}
    `.trim();

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: temperature,
            // You can add other generationConfig parameters here if needed
            // "maxOutputTokens": 8192, // Example
            // "topP": 0.95,
            // "topK": 40
        },
        // Consider adding safetySettings if you encounter content blocking issues
        // safetySettings: [
        //   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        //   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        //   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        // ]
    };

    console.log("Sending to Gemini API. Model:", model, "Temp:", temperature, "TargetLang:", targetLang, "Tone:", tone);
    // console.log("Request Body:", JSON.stringify(requestBody, null, 2)); // For debugging the full request

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const responseBodyText = await response.text(); // Get raw text for better error diagnosis

        if (!response.ok) {
            let errorData;
            let errorMessage = `API request failed: ${response.status} ${response.statusText}.`;
            try {
                errorData = JSON.parse(responseBodyText);
                console.error('API Error Response (JSON):', errorData);
                errorMessage = errorData.error?.message || errorMessage;
                if (errorData.error?.details) {
                    errorMessage += ` Details: ${JSON.stringify(errorData.error.details)}`;
                }
            } catch (e) {
                console.error('API Error Response (Non-JSON):', responseBodyText);
                if (responseBodyText) errorMessage += ` Response: ${responseBodyText.substring(0, 500)}`; // Show part of non-JSON response
            }
            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseBodyText);

        if (data.promptFeedback && data.promptFeedback.blockReason) {
            const blockDetails = data.promptFeedback.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || (t.noFurtherDetails || 'No further details.');
            throw new Error((t.promptBlockedByAPI || `Prompt blocked by API: ${data.promptFeedback.blockReason}. Details: ${blockDetails}`));
        }

        const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!output) {
            console.error('No content in API response structure:', data);
            const noContentMsg = t.errorAPI?.replace('{message}', (t.noTranslationContentAPI || 'No translation content received in API response structure.')) || (t.noTranslationContentDefault || 'No translation content received.');
            throw new Error(noContentMsg);
        }
        return output;

    } catch (error) {
        console.error('Error in sendToGeminiAPI:', error);
        // Re-throw the error so it can be caught by the caller in main.js
        // The caller (main.js) will use translations to display the error message.
        throw error;
    }
}
