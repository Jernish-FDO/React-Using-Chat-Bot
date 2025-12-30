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
import { FUNCTION_DECLARATIONS, executeToolCall, getEnabledFunctionDeclarations } from './tools';
import { useApiKeyStore } from '@/stores/apiKeyStore';
import { useSettingsStore } from '@/stores/settingsStore';

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

const genAICache: Record<string, GoogleGenerativeAI> = {};

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

function mapToGeminiSchema(schema: any): any {
    if (schema.type === 'object') {
        return {
            type: SchemaType.OBJECT,
            properties: Object.fromEntries(
                Object.entries(schema.properties || {}).map(([key, value]) => [key, mapToGeminiSchema(value)])
            ),
            required: schema.required,
        };
    }
    if (schema.enum) {
        return {
            type: SchemaType.STRING,
            description: schema.description,
            format: 'enum',
            enum: schema.enum,
        };
    }
    return {
        type: SchemaType.STRING,
        description: schema.description,
    };
}

function convertToGeminiFunctionDeclarations(enabledToolIds: string[]): GeminiFunctionDeclaration[] {
    const enabledFunctions = getEnabledFunctionDeclarations(enabledToolIds);

    return enabledFunctions.map(fd => ({
        name: fd.name,
        description: fd.description,
        parameters: mapToGeminiSchema(fd.parameters),
    }));
}

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

export function createChat(options: GeminiClientOptions = {}, history: Content[] = []): ChatSession {
    const model = createModel(options);
    return model.startChat({ history });
}

export async function sendMessage(
    chat: ChatSession,
    message: string,
    onToken?: (token: string) => void,
    onToolCall?: (name: string, args: Record<string, unknown>) => Promise<void>
): Promise<SendMessageResult> {
    const result = await chat.sendMessageStream(message);
    let fullText = '';

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onToken) onToken(chunkText);
    }

    const response = await result.response;
    let functionCalls = response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
        return {
            text: fullText,
            finishReason: response.candidates?.[0]?.finishReason,
        };
    }

    // Handle function calls (Gemini doesn't stream function calls well, so we handle them after the text stream)
    const toolCalls: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];

    while (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
            const args = fc.args as Record<string, unknown>;
            if (onToolCall) await onToolCall(fc.name, args);
            const toolResult = await executeToolCall(fc.name, args);
            toolCalls.push({ name: fc.name, args, result: toolResult });
        }

        const functionResponseParts = toolCalls.map(tc => ({
            functionResponse: {
                name: tc.name,
                response: tc.result as object,
            },
        }));

        // Follow-up after tool execution (we could also stream this, but simpler for now)
        const followUpResult = await chat.sendMessage(functionResponseParts);
        const followUpResponse = followUpResult.response;

        const followUpText = followUpResponse.text();
        fullText += followUpText;
        if (onToken) onToken(followUpText);

        functionCalls = followUpResponse.functionCalls();
    }

    return {
        text: fullText,
        toolCalls,
        finishReason: response.candidates?.[0]?.finishReason,
    };
}

export async function generateContent(
    prompt: string,
    options: GeminiClientOptions = {}
): Promise<string> {
    const model = createModel(options);
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export function isGeminiConfigured(): boolean {
    const userApiKey = useApiKeyStore.getState().keys.gemini;
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    return !!(userApiKey || envApiKey);
}

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

