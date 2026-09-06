// src/js/core/apiService.js
import { getCurrentTranslations } from './i18nService.js';
import { PROVIDERS, getProviderForModel } from '../utils/providers.js';

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Builds the shared translation instruction prompt used by every provider.
 * @param {string} textToTranslate
 * @param {string} tone
 * @param {string} targetLang - English name of the target language (e.g. "German").
 * @param {string} [customPrompt] - Optional free-form user instructions.
 * @param {string} [continuityContext] - Optional excerpt of source->translation pairs
 *        from the end of the immediately preceding chunk of the SAME subtitle file,
 *        used to keep character names/terminology/tone consistent across chunks.
 * @returns {string}
 */
function buildTranslationPrompt(textToTranslate, tone, targetLang, customPrompt, continuityContext) {
    const trimmedCustom = (customPrompt || '').trim();
    const customSection = trimmedCustom
        ? `\nAdditional user instructions (apply these as extra style/context guidance for HOW to translate; they must never override the formatting rules above, and must never cause you to add commentary, notes, or content outside the subtitle lines themselves):\n"""\n${trimmedCustom}\n"""\n`
        : '';

    const trimmedContinuity = (continuityContext || '').trim();
    const continuitySection = trimmedContinuity
        ? `\nThis is a continuation of a longer subtitle file that is being translated in parts. For consistency with the immediately preceding part (already translated), use the same character names, terminology, and tone. Examples from just before this section (source -> translation):\n${trimmedContinuity}\n`
        : '';

    return `
Translate the following subtitles, currently in an SRT-like format, into ${targetLang}.
Maintain the original SRT formatting meticulously: sequence numbers, timestamps (e.g., "00:00:20,123 --> 00:00:22,456"), and all line breaks must be preserved exactly as in the original.
Apply a ${tone} tone to the translated dialogue portions only.
Ensure that any numbers appearing within the dialogue (e.g., "10 dollars", "Chapter 5"), which are NOT part of the SRT timestamps, are also appropriately translated or localized for the ${targetLang} language.
Do NOT add any extra explanations, comments, or any text whatsoever beyond the translated subtitle content itself. The output must be only the translated SRT.
${customSection}${continuitySection}
Original Subtitles:
${textToTranslate}
    `.trim();
}

/**
 * Sends the subtitle text to the Gemini API for translation.
 * @param {string} textToTranslate - The subtitle text (SRT-like format).
 * @param {string} apiKey - The user's Gemini API key.
 * @param {string} model - The selected Gemini model ID.
 * @param {string} tone - The desired translation tone.
 * @param {string} targetLang - The target language's English name (e.g. 'German').
 * @param {string} customPrompt - Optional free-form user instructions.
 * @param {number} temperature - The creativity level for the model.
 * @param {AbortSignal} abortSignal - The signal to abort the fetch request.
 * @returns {Promise<string>} The translated subtitle text.
 * @throws {Error} If the API request fails or returns an error.
 */
export async function sendToGeminiAPI(textToTranslate, apiKey, model, tone, targetLang, customPrompt, continuityContext, temperature, abortSignal) {
    const t = getCurrentTranslations(); // For error messages

    const apiUrl = `${GEMINI_API_BASE_URL}${model}:generateContent?key=${apiKey}`;

    const prompt = buildTranslationPrompt(textToTranslate, tone, targetLang, customPrompt, continuityContext);

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: temperature,
        },
    };

    console.log("Sending to Gemini API. Model:", model, "Temp:", temperature, "TargetLang:", targetLang, "Tone:", tone);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: abortSignal
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
                if (responseBodyText) errorMessage += ` Response: ${responseBodyText.substring(0, 500)}`;
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
        console.error('Error in sendToGeminiAPI:', error.name, error.message);
        throw error;
    }
}

/**
 * Sends the subtitle text to the DeepSeek API for translation.
 * Uses DeepSeek's OpenAI-compatible /chat/completions endpoint.
 *
 * NOTE: unlike Google's Generative Language API (which is explicitly built
 * to support direct client-side calls with an AI Studio key), most LLM
 * vendor REST APIs - including DeepSeek's - are documented primarily for
 * server-side use and may not send the CORS headers required for a browser
 * to call them directly. If that's the case here, this fetch will fail with
 * a network/CORS error that cannot be worked around from client-side code
 * alone (it would need a small backend proxy). The error handling below
 * surfaces that failure clearly rather than failing silently.
 *
 * @param {string} textToTranslate
 * @param {string} apiKey - The user's DeepSeek API key.
 * @param {string} model - e.g. 'deepseek-v4-flash' or 'deepseek-v4-pro'.
 * @param {string} tone
 * @param {string} targetLang - The target language's English name.
 * @param {string} customPrompt - Optional free-form user instructions.
 * @param {number} temperature
 * @param {AbortSignal} abortSignal
 * @returns {Promise<string>}
 */
export async function sendToDeepSeekAPI(textToTranslate, apiKey, model, tone, targetLang, customPrompt, continuityContext, temperature, abortSignal) {
    const t = getCurrentTranslations();

    const prompt = buildTranslationPrompt(textToTranslate, tone, targetLang, customPrompt, continuityContext);

    const requestBody = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        stream: false,
    };

    console.log("Sending to DeepSeek API. Model:", model, "Temp:", temperature, "TargetLang:", targetLang, "Tone:", tone);

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
            signal: abortSignal
        });

        const responseBodyText = await response.text();

        if (!response.ok) {
            let errorMessage = `API request failed: ${response.status} ${response.statusText}.`;
            try {
                const errorData = JSON.parse(responseBodyText);
                console.error('DeepSeek API Error Response (JSON):', errorData);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                console.error('DeepSeek API Error Response (Non-JSON):', responseBodyText);
                if (responseBodyText) errorMessage += ` Response: ${responseBodyText.substring(0, 500)}`;
            }
            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseBodyText);
        const output = data.choices?.[0]?.message?.content;
        if (!output) {
            console.error('No content in DeepSeek API response structure:', data);
            const noContentMsg = t.errorAPI?.replace('{message}', (t.noTranslationContentAPI || 'No translation content received in API response structure.')) || (t.noTranslationContentDefault || 'No translation content received.');
            throw new Error(noContentMsg);
        }
        return output;

    } catch (error) {
        console.error('Error in sendToDeepSeekAPI:', error.name, error.message);
        // A CORS failure surfaces here as a generic "Failed to fetch"
        // TypeError (browsers deliberately hide the real reason from JS).
        // Give the user an actionable hint instead of a cryptic message.
        if (error.name === 'TypeError') {
            throw new Error(
                (t.errorNetwork || 'Network error. Please check your internet connection.') +
                ' (If this persists, the DeepSeek API may not allow direct browser requests from this app; that would require a small server-side proxy to fix.)'
            );
        }
        throw error;
    }
}

/**
 * Sends the subtitle text to the Anthropic Claude API for translation.
 * Uses the anthropic-dangerous-direct-browser-access header, which Anthropic
 * added specifically to support BYOK (bring-your-own-key) client-side tools
 * like this one - unlike most other vendor APIs, this is officially
 * documented and supported for direct browser calls.
 *
 * @param {string} textToTranslate
 * @param {string} apiKey - The user's Anthropic API key.
 * @param {string} model - e.g. 'claude-sonnet-5' or 'claude-haiku-4-5-20251001'.
 * @param {string} tone
 * @param {string} targetLang - The target language's English name.
 * @param {string} customPrompt - Optional free-form user instructions.
 * @param {number} temperature
 * @param {AbortSignal} abortSignal
 * @returns {Promise<string>}
 */
export async function sendToClaudeAPI(textToTranslate, apiKey, model, tone, targetLang, customPrompt, continuityContext, temperature, abortSignal) {
    const t = getCurrentTranslations();

    const prompt = buildTranslationPrompt(textToTranslate, tone, targetLang, customPrompt, continuityContext);

    const requestBody = {
        model: model,
        max_tokens: 8192,
        temperature: temperature,
        messages: [{ role: 'user', content: prompt }],
    };

    console.log("Sending to Claude API. Model:", model, "Temp:", temperature, "TargetLang:", targetLang, "Tone:", tone);

    try {
        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify(requestBody),
            signal: abortSignal
        });

        const responseBodyText = await response.text();

        if (!response.ok) {
            let errorMessage = `API request failed: ${response.status} ${response.statusText}.`;
            try {
                const errorData = JSON.parse(responseBodyText);
                console.error('Claude API Error Response (JSON):', errorData);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                console.error('Claude API Error Response (Non-JSON):', responseBodyText);
                if (responseBodyText) errorMessage += ` Response: ${responseBodyText.substring(0, 500)}`;
            }
            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseBodyText);
        const output = data.content?.[0]?.text;
        if (!output) {
            console.error('No content in Claude API response structure:', data);
            const noContentMsg = t.errorAPI?.replace('{message}', (t.noTranslationContentAPI || 'No translation content received in API response structure.')) || (t.noTranslationContentDefault || 'No translation content received.');
            throw new Error(noContentMsg);
        }
        return output;

    } catch (error) {
        console.error('Error in sendToClaudeAPI:', error.name, error.message);
        throw error;
    }
}

/**
 * Routes a translation request to the correct provider's API function based
 * on the selected model.
 * @param {string} textToTranslate
 * @param {string} apiKey
 * @param {string} model
 * @param {string} tone
 * @param {string} targetLang
 * @param {string} customPrompt
 * @param {number} temperature
 * @param {AbortSignal} abortSignal
 * @returns {Promise<string>}
 */
export async function sendTranslationRequest(textToTranslate, apiKey, model, tone, targetLang, customPrompt, continuityContext, temperature, abortSignal) {
    const provider = getProviderForModel(model);
    if (provider === PROVIDERS.DEEPSEEK) {
        return sendToDeepSeekAPI(textToTranslate, apiKey, model, tone, targetLang, customPrompt, continuityContext, temperature, abortSignal);
    }
    if (provider === PROVIDERS.ANTHROPIC) {
        return sendToClaudeAPI(textToTranslate, apiKey, model, tone, targetLang, customPrompt, continuityContext, temperature, abortSignal);
    }
    return sendToGeminiAPI(textToTranslate, apiKey, model, tone, targetLang, customPrompt, continuityContext, temperature, abortSignal);
}
