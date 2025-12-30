import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    query,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from './authStore';
import type { Conversation, Message } from '../types/chat';
import { generateId } from '../utils/helpers';

interface ChatState {
    // State
    conversations: Conversation[];
    activeConversationId: string | null;
    isGenerating: boolean;
    loading: boolean;
    error: string | null;

    // Actions
    createConversation: (title?: string) => string;
    deleteConversation: (id: string) => void;
    setActiveConversation: (id: string | null) => void;
    updateConversationTitle: (id: string, title: string) => void;
    setConversations: (conversations: Conversation[]) => void;

    addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Message;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (conversationId: string, messageId: string) => void;

    setGenerating: (generating: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    fetchConversations: () => Promise<void>;

    // Getters (computed)
    getActiveConversation: () => Conversation | undefined;
    getConversation: (id: string) => Conversation | undefined;
}

// Helper to sync a single conversation to Firestore
const syncConversationToFirestore = async (userId: string, conversation: Conversation) => {
    try {
        const docRef = doc(db, `users/${userId}/conversations`, conversation.id);
        await setDoc(docRef, {
            ...conversation,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error('Error syncing to Firestore:', error);
    }
};

export const useChatStore = create<ChatState>()(
    persist(
        immer((set, get) => ({
            conversations: [],
            activeConversationId: null,
            isGenerating: false,
            loading: false,
            error: null,

            createConversation: (title) => {
                const id = generateId();
                const { user } = useAuthStore.getState();
                const newConversation: Conversation = {
                    id,
                    userId: user?.uid || '',
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

                if (user) {
                    syncConversationToFirestore(user.uid, newConversation);
                }

                return id;
            },

            deleteConversation: (id) => {
                const { user } = useAuthStore.getState();
                set((state) => {
                    const index = state.conversations.findIndex(c => c.id === id);
                    if (index !== -1) {
                        state.conversations.splice(index, 1);
                    }
                    if (state.activeConversationId === id) {
                        state.activeConversationId = state.conversations[0]?.id ?? null;
                    }
                });

                if (user) {
                    deleteDoc(doc(db, `users/${user.uid}/conversations`, id))
                        .catch(err => console.error('Error deleting from Firestore:', err));
                }
            },

            setActiveConversation: (id) => {
                set((state) => {
                    state.activeConversationId = id;
                    state.error = null;
                });
            },

            updateConversationTitle: (id, title) => {
                const { user } = useAuthStore.getState();
                set((state) => {
                    const conversation = state.conversations.find(c => c.id === id);
                    if (conversation) {
                        conversation.title = title;
                        conversation.updatedAt = new Date();
                    }
                });

                const conversation = get().conversations.find(c => c.id === id);
                if (user && conversation) {
                    syncConversationToFirestore(user.uid, conversation);
                }
            },

            setConversations: (conversations) => {
                set((state) => {
                    state.conversations = conversations;
                });
            },

            addMessage: (conversationId, messageData) => {
                const { user } = useAuthStore.getState();
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

                const conversation = get().conversations.find(c => c.id === conversationId);
                if (user && conversation) {
                    syncConversationToFirestore(user.uid, conversation);
                }

                return message;
            },

            updateMessage: (conversationId, messageId, updates) => {
                const { user } = useAuthStore.getState();
                set((state) => {
                    const conversation = state.conversations.find(c => c.id === conversationId);
                    if (conversation) {
                        const message = conversation.messages.find(m => m.id === messageId);
                        if (message) {
                            Object.assign(message, updates);
                        }
                    }
                });

                const conversation = get().conversations.find(c => c.id === conversationId);
                if (user && conversation) {
                    syncConversationToFirestore(user.uid, conversation);
                }
            },

            deleteMessage: (conversationId, messageId) => {
                const { user } = useAuthStore.getState();
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

                const conversation = get().conversations.find(c => c.id === conversationId);
                if (user && conversation) {
                    syncConversationToFirestore(user.uid, conversation);
                }
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

            fetchConversations: async () => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                set({ loading: true });
                try {
                    const q = query(
                        collection(db, `users/${user.uid}/conversations`),
                        orderBy('updatedAt', 'desc')
                    );
                    const querySnapshot = await getDocs(q);
                    const conversations: Conversation[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        conversations.push({
                            ...data,
                            createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                            updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
                            messages: (data.messages || []).map((m: Message) => {
                                const timestamp = m.timestamp as unknown as { toDate?: () => Date };
                                return {
                                    ...m,
                                    timestamp: timestamp.toDate ? timestamp.toDate() : new Date(m.timestamp),
                                };
                            }),
                        } as Conversation);
                    });
                    set({ conversations });
                } catch (error) {
                    console.error('Error fetching conversations:', error);
                } finally {
                    set({ loading: false });
                }
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
