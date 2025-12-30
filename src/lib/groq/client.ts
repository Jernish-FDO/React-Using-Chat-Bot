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

import { FUNCTION_DECLARATIONS, executeToolCall } from '../gemini/tools';

/**
 * Send a message to Groq with tool support
 */
export async function sendMessage(
    messages: { role: 'user' | 'assistant' | 'system' | 'tool', content: string, tool_call_id?: string, name?: string }[],
    modelId: string = 'llama-3.3-70b-versatile',
    enabledToolIds: string[] = [],
    onToken?: (token: string) => void,
    onToolCall?: (name: string, args: Record<string, unknown>) => Promise<void>
): Promise<GroqSendMessageResult> {
    const client = getClient();
    const { systemPrompt: storeSystemPrompt, temperature: storeTemperature } = useSettingsStore.getState();

    // Prepend system prompt if not present
    const hasSystemPrompt = messages.some(m => m.role === 'system');
    let fullMessages: any[] = hasSystemPrompt
        ? messages
        : [{ role: 'system', content: storeSystemPrompt || SYSTEM_PROMPT }, ...messages];

    // Map tools to Groq format
    const toolIdToFunctionName: Record<string, string> = {
        'web_search': 'web_search',
        'get_current_time': 'get_current_time',
        'calculator': 'calculate',
        'weather': 'get_weather',
        'stock_data': 'get_stock_price',
        'image_generation': 'generate_image',
    };

    const enabledFunctionNames = enabledToolIds
        .map(id => toolIdToFunctionName[id])
        .filter(Boolean);

    const tools = FUNCTION_DECLARATIONS
        .filter(fd => enabledFunctionNames.includes(fd.name))
        .map(fd => ({
            type: 'function' as const,
            function: {
                name: fd.name,
                description: fd.description,
                parameters: fd.parameters,
            },
        }));

    let response = await client.chat.completions.create({
        messages: fullMessages,
        model: modelId,
        temperature: storeTemperature,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        stream: true,
    });

    let fullText = '';
    let toolCalls_internal: any[] = [];
    let finishReason: string | null = null;

    for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
            fullText += delta.content;
            if (onToken) onToken(delta.content);
        }
        if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
                if (!toolCalls_internal[tc.index]) {
                    toolCalls_internal[tc.index] = { id: tc.id, function: { name: '', arguments: '' } };
                }
                if (tc.id) toolCalls_internal[tc.index].id = tc.id;
                if (tc.function?.name) toolCalls_internal[tc.index].function.name += tc.function.name;
                if (tc.function?.arguments) toolCalls_internal[tc.index].function.arguments += tc.function.arguments;
            }
        }
        if (chunk.choices[0]?.finish_reason) {
            finishReason = chunk.choices[0].finish_reason;
        }
    }

    const toolCalls: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];

    while (toolCalls_internal.length > 0) {
        fullMessages.push({
            role: 'assistant',
            content: fullText,
            tool_calls: toolCalls_internal,
        });

        for (const tc of toolCalls_internal) {
            const args = JSON.parse(tc.function.arguments);
            if (onToolCall) await onToolCall(tc.function.name, args);

            const result = await executeToolCall(tc.function.name, args);
            toolCalls.push({ name: tc.function.name, args, result });

            fullMessages.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: tc.function.name,
                content: JSON.stringify(result),
            });
        }

        const nextResponse = await client.chat.completions.create({
            messages: fullMessages,
            model: modelId,
            stream: true,
        });

        fullText = ''; // Reset for follow-up
        toolCalls_internal = [];

        for await (const chunk of nextResponse) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
                fullText += delta.content;
                if (onToken) onToken(delta.content);
            }
            if (delta?.tool_calls) {
                // Handle nested tool calls if any...
                // This part would require more complex logic if Groq supports nested tool calls in streaming
                // For now, we assume only one level of tool calls per turn.
                for (const tc of delta.tool_calls) {
                    if (!toolCalls_internal[tc.index]) {
                        toolCalls_internal[tc.index] = { id: tc.id, function: { name: '', arguments: '' } };
                    }
                    if (tc.id) toolCalls_internal[tc.index].id = tc.id;
                    if (tc.function?.name) toolCalls_internal[tc.index].function.name += tc.function.name;
                    if (tc.function?.arguments) toolCalls_internal[tc.index].function.arguments += tc.function.arguments;
                }
            }
            if (chunk.choices[0]?.finish_reason) {
                finishReason = chunk.choices[0].finish_reason;
            }
        }
    }

    return {
        text: fullText,
        toolCalls,
        finishReason,
    };
}

/**
 * Check if Groq is configured
 */
export function isGroqConfigured(): boolean {
    return !!import.meta.env.VITE_GROQ_API_KEY;
}
