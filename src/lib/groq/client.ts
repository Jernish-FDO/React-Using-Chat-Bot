// Groq API client
import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from '../gemini/prompts';

export interface GroqSendMessageResult {
    text: string;
    toolCalls?: Array<{ name: string; args: Record<string, unknown>; result: unknown }>;
    finishReason?: string | null;
}

import { useApiKeyStore } from '@/stores/apiKeyStore';
import { useSettingsStore } from '@/stores/settingsStore';

let groq: Groq | null = null;
let lastApiKey: string | null = null;

/**
 * Initialize the Groq client
 */
function getClient(): Groq {
    const userApiKey = useApiKeyStore.getState().keys.groq;
    const envApiKey = import.meta.env.VITE_GROQ_API_KEY;
    const apiKey = userApiKey || envApiKey;

    if (!apiKey) {
        throw new Error('Groq API key not configured. Please add it in Settings.');
    }

    if (apiKey !== lastApiKey) {
        groq = new Groq({
            apiKey,
            dangerouslyAllowBrowser: true
        });
        lastApiKey = apiKey;
    }

    return groq!;
}

/**
 * Send a message to Groq
 */
export async function sendMessage(
    messages: { role: 'user' | 'assistant' | 'system', content: string }[],
    modelId: string = 'llama-3.3-70b-versatile',
    temperature?: number
): Promise<GroqSendMessageResult> {
    const client = getClient();
    const { systemPrompt: storeSystemPrompt, temperature: storeTemperature } = useSettingsStore.getState();

    // Prepend system prompt if not present
    const hasSystemPrompt = messages.some(m => m.role === 'system');
    const fullMessages = hasSystemPrompt
        ? messages
        : [{ role: 'system', content: storeSystemPrompt || SYSTEM_PROMPT } as const, ...messages];

    const response = await client.chat.completions.create({
        messages: fullMessages,
        model: modelId,
        temperature: temperature ?? storeTemperature,
    });

    return {
        text: response.choices[0]?.message?.content || '',
        finishReason: response.choices[0]?.finish_reason,
    };
}

/**
 * Check if Groq is configured
 */
export function isGroqConfigured(): boolean {
    return !!import.meta.env.VITE_GROQ_API_KEY;
}
