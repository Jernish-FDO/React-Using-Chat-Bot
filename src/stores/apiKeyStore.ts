import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from './authStore';

export interface APIKeys {
    gemini?: string;
    tavily?: string;
    weather?: string;
    groq?: string;
}

interface APIKeyState {
    keys: APIKeys;
    loading: boolean;
    error: string | null;

    setKey: (provider: keyof APIKeys, key: string) => void;
    removeKey: (provider: keyof APIKeys) => void;
    fetchKeys: () => Promise<void>;
    syncToFirestore: () => Promise<void>;
    clearKeys: () => void;
}

export const useApiKeyStore = create<APIKeyState>()(
    persist(
        (set, get) => ({
            keys: {},
            loading: false,
            error: null,

            setKey: (provider, key) => {
                set((state) => ({
                    keys: { ...state.keys, [provider]: key }
                }));
                get().syncToFirestore();
            },

            removeKey: (provider) => {
                set((state) => {
                    const newKeys = { ...state.keys };
                    delete newKeys[provider];
                    return { keys: newKeys };
                });
                get().syncToFirestore();
            },

            fetchKeys: async () => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                set({ loading: true, error: null });
                try {
                    const docRef = doc(db, `users/${user.uid}/config`, 'apiKeys');
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        set({ keys: docSnap.data() as APIKeys });
                    }
                } catch (error: unknown) {
                    console.error('Error fetching API keys:', error);
                    set({ error: 'Failed to fetch API keys' });
                } finally {
                    set({ loading: false });
                }
            },

            syncToFirestore: async () => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                const { keys } = get();
                try {
                    const docRef = doc(db, `users/${user.uid}/config`, 'apiKeys');
                    await setDoc(docRef, keys);
                } catch (error: unknown) {
                    console.error('Error syncing API keys:', error);
                }
            },

            clearKeys: () => set({ keys: {} }),
        }),
        {
            name: 'api-keys-storage',
        }
    )
);
