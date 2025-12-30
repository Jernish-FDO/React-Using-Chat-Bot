import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    doc,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from './authStore';

export type AIProvider = 'gemini' | 'groq';

export interface AIModel {
    id: string;
    name: string;
    description: string;
    provider: AIProvider;
}

export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Newest and most capable Flash model (Google)',
        provider: 'gemini',
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Fastest Gemini model (Google)',
        provider: 'gemini',
    },
    {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'High performance versatile model (Meta)',
        provider: 'groq',
    },
    {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        description: 'Ultra-fast inference (Meta)',
        provider: 'groq',
    },
    {
        id: 'llama-3.3-70b-specdec',
        name: 'Llama 3.3 70B (Speculative)',
        description: 'High speed performance model (Meta)',
        provider: 'groq',
    },
];

interface SettingsState {
    provider: AIProvider;
    modelId: string;
    systemPrompt: string;
    temperature: number;
    topP: number;

    setProvider: (provider: AIProvider) => void;
    setModelId: (modelId: string) => void;
    setSystemPrompt: (prompt: string) => void;
    setTemperature: (temp: number) => void;
    setTopP: (p: number) => void;
    resetToDefaults: () => void;
    getCurrentModel: () => AIModel | undefined;
    fetchSettings: () => Promise<void>;
}

const syncSettingsToFirestore = async (userId: string, settings: Partial<SettingsState>) => {
    try {
        const docRef = doc(db, `users/${userId}/settings`, 'preferences');
        await setDoc(docRef, settings, { merge: true });
    } catch (error) {
        console.error('Error syncing settings to Firestore:', error);
    }
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            provider: 'gemini',
            modelId: 'gemini-2.5-flash-lite',
            systemPrompt: '',
            temperature: 0.7,
            topP: 0.95,

            setProvider: (provider) => {
                const { user } = useAuthStore.getState();
                const firstModelOfProvider = AVAILABLE_MODELS.find(m => m.provider === provider);
                const newState = {
                    provider,
                    modelId: firstModelOfProvider?.id ?? (provider === 'gemini' ? 'gemini-2.5-flash-lite' : 'llama-3.1-8b-instant')
                };
                set(newState);
                if (user) syncSettingsToFirestore(user.uid, newState);
            },

            setModelId: (modelId) => {
                const { user } = useAuthStore.getState();
                const model = AVAILABLE_MODELS.find(m => m.id === modelId);
                if (model) {
                    const newState = { modelId, provider: model.provider };
                    set(newState);
                    if (user) syncSettingsToFirestore(user.uid, newState);
                }
            },

            setSystemPrompt: (systemPrompt) => {
                const { user } = useAuthStore.getState();
                set({ systemPrompt });
                if (user) syncSettingsToFirestore(user.uid, { systemPrompt });
            },

            setTemperature: (temperature) => {
                const { user } = useAuthStore.getState();
                set({ temperature });
                if (user) syncSettingsToFirestore(user.uid, { temperature });
            },

            setTopP: (topP) => {
                const { user } = useAuthStore.getState();
                set({ topP });
                if (user) syncSettingsToFirestore(user.uid, { topP });
            },

            resetToDefaults: () => {
                const { user } = useAuthStore.getState();
                const defaults = {
                    systemPrompt: '',
                    temperature: 0.7,
                    topP: 0.95,
                };
                set(defaults);
                if (user) syncSettingsToFirestore(user.uid, defaults);
            },

            getCurrentModel: () => {
                const { modelId } = get();
                return AVAILABLE_MODELS.find(m => m.id === modelId);
            },

            fetchSettings: async () => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                try {
                    const docRef = doc(db, `users/${user.uid}/settings`, 'preferences');
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        set(docSnap.data() as Partial<SettingsState>);
                    }
                } catch (error) {
                    console.error('Error fetching settings:', error);
                }
            },
        }),
        {
            name: 'ai-settings-storage',
        }
    )
);
