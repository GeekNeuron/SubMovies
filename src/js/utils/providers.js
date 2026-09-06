// src/js/utils/providers.js
// Central definition of AI providers supported by SubMovies, and which
// provider each model ID belongs to. Add a new provider's models here and
// to the `models` object in each src/lang/<code>.json file.

export const PROVIDERS = {
    GEMINI: 'gemini',
    DEEPSEEK: 'deepseek',
    ANTHROPIC: 'anthropic',
};

// Display name shown in the UI (brand names, intentionally not translated -
// same convention as "GeekNeuron" in the footer).
export const PROVIDER_DISPLAY_NAME = {
    [PROVIDERS.GEMINI]: 'Gemini',
    [PROVIDERS.DEEPSEEK]: 'DeepSeek',
    [PROVIDERS.ANTHROPIC]: 'Claude',
};

/**
 * Determines which provider a given model ID belongs to, based on its prefix.
 * @param {string} modelId
 * @returns {string} one of PROVIDERS.*
 */
export function getProviderForModel(modelId) {
    if (typeof modelId !== 'string') return PROVIDERS.GEMINI;
    if (modelId.startsWith('deepseek')) return PROVIDERS.DEEPSEEK;
    if (modelId.startsWith('claude')) return PROVIDERS.ANTHROPIC;
    return PROVIDERS.GEMINI;
}
