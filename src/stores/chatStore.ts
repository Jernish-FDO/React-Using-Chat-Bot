// Chat state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Message, Conversation } from '@/types/chat';
import { generateId } from '@/utils/helpers';

interface ChatState {
    // State
    conversations: Conversation[];
    activeConversationId: string | null;
    isGenerating: boolean;
    error: string | null;

    // Actions
    createConversation: (title?: string) => string;
    deleteConversation: (id: string) => void;
    setActiveConversation: (id: string | null) => void;
    updateConversationTitle: (id: string, title: string) => void;

    addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Message;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (conversationId: string, messageId: string) => void;

    setGenerating: (generating: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;

    // Getters (computed)
    getActiveConversation: () => Conversation | undefined;
    getConversation: (id: string) => Conversation | undefined;
}

export const useChatStore = create<ChatState>()(
    persist(
        immer((set, get) => ({
            conversations: [],
            activeConversationId: null,
            isGenerating: false,
            error: null,

            createConversation: (title) => {
                const id = generateId();
                const newConversation: Conversation = {
                    id,
                    userId: '', // Will be set when auth is implemented
                    title: title || 'New Chat',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    messageCount: 0,
                    toolsUsed: [],
                    isDeepResearch: false,
                    messages: [],
                };

                set((state) => {
                    state.conversations.unshift(newConversation);
                    state.activeConversationId = id;
                });

                return id;
            },

            deleteConversation: (id) => {
                set((state) => {
                    const index = state.conversations.findIndex(c => c.id === id);
                    if (index !== -1) {
                        state.conversations.splice(index, 1);
                    }
                    if (state.activeConversationId === id) {
                        state.activeConversationId = state.conversations[0]?.id ?? null;
                    }
                });
            },

            setActiveConversation: (id) => {
                set((state) => {
                    state.activeConversationId = id;
                    state.error = null;
                });
            },

            updateConversationTitle: (id, title) => {
                set((state) => {
                    const conversation = state.conversations.find(c => c.id === id);
                    if (conversation) {
                        conversation.title = title;
                        conversation.updatedAt = new Date();
                    }
                });
            },

            addMessage: (conversationId, messageData) => {
                const message: Message = {
                    ...messageData,
                    id: generateId(),
                    timestamp: new Date(),
                };

                set((state) => {
                    const conversation = state.conversations.find(c => c.id === conversationId);
                    if (conversation) {
                        conversation.messages.push(message);
                        conversation.messageCount = conversation.messages.length;
                        conversation.updatedAt = new Date();

                        // Auto-generate title from first user message
                        if (conversation.messages.length === 1 && message.role === 'user') {
                            const words = message.content.split(' ').slice(0, 6).join(' ');
                            conversation.title = words.length < message.content.length
                                ? words + '...'
                                : words;
                        }

                        // Track tool usage
                        if (message.metadata?.toolName && !conversation.toolsUsed.includes(message.metadata.toolName)) {
                            conversation.toolsUsed.push(message.metadata.toolName);
                        }
                    }
                });

                return message;
            },

            updateMessage: (conversationId, messageId, updates) => {
                set((state) => {
                    const conversation = state.conversations.find(c => c.id === conversationId);
                    if (conversation) {
                        const message = conversation.messages.find(m => m.id === messageId);
                        if (message) {
                            Object.assign(message, updates);
                        }
                    }
                });
            },

            deleteMessage: (conversationId, messageId) => {
                set((state) => {
                    const conversation = state.conversations.find(c => c.id === conversationId);
                    if (conversation) {
                        const index = conversation.messages.findIndex(m => m.id === messageId);
                        if (index !== -1) {
                            conversation.messages.splice(index, 1);
                            conversation.messageCount = conversation.messages.length;
                        }
                    }
                });
            },

            setGenerating: (generating) => {
                set((state) => {
                    state.isGenerating = generating;
                });
            },

            setError: (error) => {
                set((state) => {
                    state.error = error;
                    state.isGenerating = false;
                });
            },

            clearError: () => {
                set((state) => {
                    state.error = null;
                });
            },

            getActiveConversation: () => {
                const state = get();
                return state.conversations.find(c => c.id === state.activeConversationId);
            },

            getConversation: (id) => {
                return get().conversations.find(c => c.id === id);
            },
        })),
        {
            name: 'chat-storage',
            partialize: (state) => ({
                conversations: state.conversations.map(c => ({
                    ...c,
                    // Convert dates to ISO strings for storage
                    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
                    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
                    messages: c.messages.map(m => ({
                        ...m,
                        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
                    })),
                })),
                activeConversationId: state.activeConversationId,
            }),
            onRehydrateStorage: () => (state) => {
                // Convert ISO strings back to Date objects
                if (state) {
                    state.conversations = state.conversations.map(c => ({
                        ...c,
                        createdAt: new Date(c.createdAt),
                        updatedAt: new Date(c.updatedAt),
                        messages: c.messages.map(m => ({
                            ...m,
                            timestamp: new Date(m.timestamp),
                        })),
                    }));
                }
            },
        }
    )
);
