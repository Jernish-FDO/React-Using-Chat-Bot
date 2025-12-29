// Tool-related types

export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'search' | 'analysis' | 'utility';
    enabled: boolean;
    requiresApiKey?: boolean;
    functionDeclaration: FunctionDeclaration;
    execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface FunctionDeclaration {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, ParameterDefinition>;
        required: string[];
    };
}

export interface ParameterDefinition {
    type: string;
    description: string;
    enum?: string[];
}

export interface ToolCall {
    name: string;
    args: Record<string, unknown>;
}

export interface ToolResult {
    name: string;
    response: unknown;
    error?: string;
}

export interface ToolState {
    tools: ToolDefinition[];
    enabledToolIds: string[];
    isExecuting: boolean;
    lastToolCall?: ToolCall;
}
