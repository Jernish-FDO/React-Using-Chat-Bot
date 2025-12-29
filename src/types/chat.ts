// Chat-related types

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    timestamp: Date;
    metadata?: MessageMetadata;
}

export interface MessageMetadata {
    toolName?: string;
    toolResults?: unknown;
    sources?: Source[];
    thinkingTime?: number;
    isStreaming?: boolean;
    error?: string;
}

export interface Source {
    url: string;
    title: string;
    snippet: string;
    favicon?: string;
    score?: number;
}

export interface Conversation {
    id: string;
    userId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    toolsUsed: string[];
    isDeepResearch: boolean;
    messages: Message[];
}

export interface ChatState {
    conversations: Conversation[];
    activeConversationId: string | null;
    isGenerating: boolean;
    error: string | null;
}

export type SendMessageOptions = {
    enableTools?: boolean;
    isDeepResearch?: boolean;
};
