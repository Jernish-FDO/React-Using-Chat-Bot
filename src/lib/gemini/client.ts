// Gemini API client
import {
    GoogleGenerativeAI,
    type GenerativeModel,
    type ChatSession,
    type FunctionDeclaration as GeminiFunctionDeclaration,
    SchemaType,
    type Content
} from '@google/generative-ai';
import { SYSTEM_PROMPT } from './prompts';
import { FUNCTION_DECLARATIONS, executeToolCall } from './tools';

export type GeminiModel = 'gemini-2.5-flash-lite' | 'gemini-2.5-flash';

export interface GeminiClientOptions {
    model?: GeminiModel;
    enabledToolIds?: string[];
    temperature?: number;
    maxOutputTokens?: number;
}

export interface SendMessageResult {
    text: string;
    toolCalls?: Array<{ name: string; args: Record<string, unknown>; result: unknown }>;
    finishReason?: string;
}

// genAI instance cache
const genAICache: Record<string, GoogleGenerativeAI> = {};

import { useApiKeyStore } from '@/stores/apiKeyStore';

/**
 * Initialize the Gemini client
 */
function getClient(): GoogleGenerativeAI {
    const userApiKey = useApiKeyStore.getState().keys.gemini;
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const apiKey = userApiKey || envApiKey;

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please add it in Settings.');
    }

    if (!genAICache[apiKey]) {
        genAICache[apiKey] = new GoogleGenerativeAI(apiKey);
    }

    return genAICache[apiKey];
}

/**
 * Convert our function declarations to Gemini format
 */
function convertToGeminiFunctionDeclarations(enabledToolIds: string[]): GeminiFunctionDeclaration[] {
    const toolIdToFunctionName: Record<string, string> = {
        'web_search': 'web_search',
        'get_current_time': 'get_current_time',
        'calculator': 'calculate',
    };

    const enabledFunctions = enabledToolIds
        .map(id => toolIdToFunctionName[id])
        .filter(Boolean);

    return FUNCTION_DECLARATIONS
        .filter(fd => enabledFunctions.includes(fd.name))
        .map(fd => ({
            name: fd.name,
            description: fd.description,
            parameters: {
                type: SchemaType.OBJECT,
                properties: Object.fromEntries(
                    Object.entries(fd.parameters.properties).map(([key, value]) => {
                        // Handle enum vs regular string
                        if (value.enum && value.enum.length > 0) {
                            return [
                                key,
                                {
                                    type: SchemaType.STRING,
                                    description: value.description,
                                    format: 'enum',
                                    enum: value.enum,
                                },
                            ];
                        }
                        return [
                            key,
                            {
                                type: SchemaType.STRING,
                                description: value.description,
                            },
                        ];
                    })
                ),
                required: fd.parameters.required,
            },
        }));
}

import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Create a generative model with the specified configuration
 */
export function createModel(options: GeminiClientOptions = {}): GenerativeModel {
    const {
        systemPrompt: storeSystemPrompt,
        temperature: storeTemperature,
        topP: storeTopP
    } = useSettingsStore.getState();

    const {
        model = 'gemini-2.5-flash-lite',
        enabledToolIds = [],
        temperature = storeTemperature,
        maxOutputTokens = 8192,
    } = options;

    const client = getClient();
    const functionDeclarations = convertToGeminiFunctionDeclarations(enabledToolIds);

    return client.getGenerativeModel({
        model,
        systemInstruction: storeSystemPrompt || SYSTEM_PROMPT,
        generationConfig: {
            temperature,
            topP: storeTopP || 0.95,
            topK: 64,
            maxOutputTokens,
        },
        tools: functionDeclarations.length > 0
            ? [{ functionDeclarations }]
            : undefined,
    });
}

/**
 * Create a chat session with optional history
 */
export function createChat(options: GeminiClientOptions = {}, history: Content[] = []): ChatSession {
    const model = createModel(options);
    return model.startChat({ history });
}

/**
 * Send a message and handle tool calls
 */
export async function sendMessage(
    chat: ChatSession,
    message: string,
    onToolCall?: (name: string, args: Record<string, unknown>) => Promise<void>
): Promise<SendMessageResult> {
    const result = await chat.sendMessage(message);
    const response = result.response;

    const functionCalls = response.functionCalls();

    // If no function calls, return the text response
    if (!functionCalls || functionCalls.length === 0) {
        return {
            text: response.text(),
            finishReason: response.candidates?.[0]?.finishReason,
        };
    }

    // Handle function calls
    const toolCalls: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];

    for (const fc of functionCalls) {
        const args = fc.args as Record<string, unknown>;

        // Notify about tool call
        if (onToolCall) {
            await onToolCall(fc.name, args);
        }

        // Execute the tool
        const toolResult = await executeToolCall(fc.name, args);

        toolCalls.push({
            name: fc.name,
            args,
            result: toolResult,
        });
    }

    // Send tool results back to the model using the correct format
    const functionResponseParts = toolCalls.map(tc => ({
        functionResponse: {
            name: tc.name,
            response: tc.result as object,
        },
    }));

    const followUpResult = await chat.sendMessage(functionResponseParts);

    return {
        text: followUpResult.response.text(),
        toolCalls,
        finishReason: followUpResult.response.candidates?.[0]?.finishReason,
    };
}

/**
 * Generate content without chat context (single turn)
 */
export async function generateContent(
    prompt: string,
    options: GeminiClientOptions = {}
): Promise<string> {
    const model = createModel(options);
    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
}

/**
 * Get available models
 */
export function getAvailableModels(): Array<{ id: GeminiModel; name: string; description: string }> {
    return [
        {
            id: 'gemini-2.5-flash-lite',
            name: 'Gemini 2.5 Flash Lite',
            description: 'Latest and fastest, with native tool support',
        },
        {
            id: 'gemini-2.5-flash',
            name: 'Gemini 2.5 Flash',
            description: 'Stable and reliable, great for most tasks',
        },
    ];
}
