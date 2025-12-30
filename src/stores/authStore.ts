import { create } from 'zustand';
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    type User
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;

    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    error: null,

    signInWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to sign in';
            set({ error: message, loading: false });
        }
    },

    signInWithEmail: async (email, pass) => {
        set({ loading: true, error: null });
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to sign in';
            set({ error: message, loading: false });
        }
    },

    signUpWithEmail: async (email, pass, name) => {
        set({ loading: true, error: null });
        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(user, { displayName: name });
            set({ user: { ...user, displayName: name } as User });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to sign up';
            set({ error: message, loading: false });
        }
    },

    signOut: async () => {
        set({ loading: true, error: null });
        try {
            await firebaseSignOut(auth);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to sign out';
            set({ error: message, loading: false });
        }
    },

    setUser: (user) => set({ user, loading: false }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
}));

// Initialize auth listener
onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().setUser(user);
});
