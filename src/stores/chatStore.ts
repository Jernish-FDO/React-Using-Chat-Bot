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
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from './authStore';
import type { Conversation, Message } from '../types/chat';
import { generateId, sanitizeForFirestore } from '../utils/helpers';

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

    // Getters
    getActiveConversation: () => Conversation | undefined;
}

// Utility to convert dates safely for Firestore/JSON/LocalStorage
const serializeDate = (date: any): string => {
    try {
        if (!date) return new Date().toISOString();
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) {
            console.warn('Invalid date detected during serialization:', date);
            return new Date().toISOString();
        }
        return d.toISOString();
    } catch (err) {
        console.error('Serialization error:', err);
        return new Date().toISOString();
    }
};

const parseDate = (date: any): Date => {
    try {
        if (!date) return new Date();
        // Handle Firestore Timestamp
        if (typeof date.toDate === 'function') return date.toDate();

        // Handle empty object {} case which causes RangeError in new Date()
        if (typeof date === 'object' && Object.keys(date).length === 0) return new Date();

        const d = new Date(date);
        if (isNaN(d.getTime())) return new Date();
        return d;
    } catch (err) {
        return new Date();
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
                const now = new Date();

                const newConversation: Conversation = {
                    id,
                    userId: user?.uid || '',
                    title: title || 'New Chat',
                    createdAt: now,
                    updatedAt: now,
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
                    const { userId, ...rest } = newConversation;
                    setDoc(doc(db, `users/${user.uid}/conversations`, id), sanitizeForFirestore({
                        ...rest,
                        userId: user.uid,
                        createdAt: now,
                        updatedAt: now,
                    })).catch(console.error);
                }

                return id;
            },

            deleteConversation: (id) => {
                const { user } = useAuthStore.getState();
                set((state) => {
                    const index = state.conversations.findIndex(c => c.id === id);
                    if (index !== -1) state.conversations.splice(index, 1);
                    if (state.activeConversationId === id) {
                        state.activeConversationId = state.conversations[0]?.id ?? null;
                    }
                });

                if (user) {
                    deleteDoc(doc(db, `users/${user.uid}/conversations`, id)).catch(console.error);
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
                const now = new Date();

                set((state) => {
                    const conv = state.conversations.find(c => c.id === id);
                    if (conv) {
                        conv.title = title;
                        conv.updatedAt = now;
                    }
                });

                if (user) {
                    setDoc(doc(db, `users/${user.uid}/conversations`, id), sanitizeForFirestore({ title, updatedAt: now }), { merge: true }).catch(console.error);
                }
            },

            setConversations: (conversations) => {
                set((state) => {
                    state.conversations = conversations;
                });
            },

            addMessage: (conversationId, messageData) => {
                const { user } = useAuthStore.getState();
                const now = new Date();
                const message: Message = {
                    ...messageData,
                    id: generateId(),
                    timestamp: now,
                };

                set((state) => {
                    const conversation = state.conversations.find(c => c.id === conversationId);
                    if (conversation) {
                        conversation.messages.push(message);
                        conversation.messageCount = conversation.messages.length;
                        conversation.updatedAt = now;

                        if (conversation.messages.length === 1 && message.role === 'user') {
                            const words = message.content.split(' ').slice(0, 6).join(' ');
                            conversation.title = words.length < message.content.length ? words + '...' : words;
                        }

                        if (message.metadata?.toolName && !conversation.toolsUsed.includes(message.metadata.toolName)) {
                            conversation.toolsUsed.push(message.metadata.toolName);
                        }
                    }
                });

                const conversation = get().conversations.find(c => c.id === conversationId);
                if (user && conversation) {
                    setDoc(doc(db, `users/${user.uid}/conversations`, conversationId), sanitizeForFirestore({
                        ...conversation,
                        updatedAt: now
                    })).catch(console.error);
                }

                return message;
            },

            updateMessage: (conversationId, messageId, updates) => {
                const { user } = useAuthStore.getState();
                set((state) => {
                    const conv = state.conversations.find(c => c.id === conversationId);
                    if (conv) {
                        const msg = conv.messages.find(m => m.id === messageId);
                        if (msg) Object.assign(msg, updates);
                    }
                });

                const conversation = get().conversations.find(c => c.id === conversationId);
                if (user && conversation) {
                    setDoc(doc(db, `users/${user.uid}/conversations`, conversationId), sanitizeForFirestore(conversation)).catch(console.error);
                }
            },

            deleteMessage: (conversationId, messageId) => {
                const { user } = useAuthStore.getState();
                set((state) => {
                    const conv = state.conversations.find(c => c.id === conversationId);
                    if (conv) {
                        conv.messages = conv.messages.filter(m => m.id !== messageId);
                        conv.messageCount = conv.messages.length;
                    }
                });

                const conversation = get().conversations.find(c => c.id === conversationId);
                if (user && conversation) {
                    setDoc(doc(db, `users/${user.uid}/conversations`, conversationId), sanitizeForFirestore(conversation)).catch(console.error);
                }
            },

            setGenerating: (generating) => set({ isGenerating: generating }),
            setError: (error) => set({ error, isGenerating: false }),
            clearError: () => set({ error: null }),

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
                            id: doc.id,
                            createdAt: parseDate(data.createdAt),
                            updatedAt: parseDate(data.updatedAt),
                            messages: (data.messages || []).map((m: any) => ({
                                ...m,
                                timestamp: parseDate(m.timestamp),
                            })),
                        } as Conversation);
                    });

                    set({ conversations, loading: false });
                } catch (error) {
                    console.error('Error fetching:', error);
                    set({ loading: false });
                }
            },

            getActiveConversation: () => {
                const state = get();
                return state.conversations.find(c => c.id === state.activeConversationId);
            },
        })),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                conversations: state.conversations.map(c => ({
                    ...c,
                    createdAt: serializeDate(c.createdAt),
                    updatedAt: serializeDate(c.updatedAt),
                    messages: c.messages.map(m => ({
                        ...m,
                        timestamp: serializeDate(m.timestamp),
                    })),
                })),
                activeConversationId: state.activeConversationId,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.conversations = state.conversations.map(c => ({
                        ...c,
                        createdAt: parseDate(c.createdAt),
                        updatedAt: parseDate(c.updatedAt),
                        messages: (c.messages || []).map(m => ({
                            ...m,
                            timestamp: parseDate(m.timestamp),
                        })),
                    }));
                }
            },
        }
    )
);
