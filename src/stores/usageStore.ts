// Usage tracking store for rate limiting and quota management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UsageLimits {
    gemini: { daily: number; warning: number };
    tavily: { monthly: number; warning: number };
    firestoreReads: { daily: number; warning: number };
    firestoreWrites: { daily: number; warning: number };
}

const LIMITS: UsageLimits = {
    gemini: { daily: 1500, warning: 0.8 },
    tavily: { monthly: 1000, warning: 0.8 },
    firestoreReads: { daily: 50000, warning: 0.8 },
    firestoreWrites: { daily: 20000, warning: 0.8 },
};

interface UsageState {
    // Usage counters
    geminiCalls: number;
    tavilyCalls: number;
    firestoreReads: number;
    firestoreWrites: number;
    lastDailyReset: string;
    lastMonthlyReset: string;

    // Actions
    incrementGemini: () => void;
    incrementTavily: () => void;
    incrementFirestoreRead: (count?: number) => void;
    incrementFirestoreWrite: (count?: number) => void;
    resetIfNeeded: () => void;

    // Getters
    checkLimits: () => { isNearLimit: boolean; warnings: string[] };
    getUsageStats: () => {
        gemini: { used: number; limit: number; percent: number };
        tavily: { used: number; limit: number; percent: number };
    };
    canMakeGeminiCall: () => boolean;
    canMakeTavilyCall: () => boolean;
}

function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const useUsageStore = create<UsageState>()(
    persist(
        (set, get) => ({
            geminiCalls: 0,
            tavilyCalls: 0,
            firestoreReads: 0,
            firestoreWrites: 0,
            lastDailyReset: getToday(),
            lastMonthlyReset: getCurrentMonth(),

            incrementGemini: () => {
                get().resetIfNeeded();
                set((state) => ({ geminiCalls: state.geminiCalls + 1 }));
            },

            incrementTavily: () => {
                get().resetIfNeeded();
                set((state) => ({ tavilyCalls: state.tavilyCalls + 1 }));
            },

            incrementFirestoreRead: (count = 1) => {
                get().resetIfNeeded();
                set((state) => ({ firestoreReads: state.firestoreReads + count }));
            },

            incrementFirestoreWrite: (count = 1) => {
                get().resetIfNeeded();
                set((state) => ({ firestoreWrites: state.firestoreWrites + count }));
            },

            resetIfNeeded: () => {
                const today = getToday();
                const currentMonth = getCurrentMonth();
                const state = get();

                if (state.lastDailyReset !== today) {
                    set({
                        geminiCalls: 0,
                        firestoreReads: 0,
                        firestoreWrites: 0,
                        lastDailyReset: today,
                    });
                }

                if (state.lastMonthlyReset !== currentMonth) {
                    set({
                        tavilyCalls: 0,
                        lastMonthlyReset: currentMonth,
                    });
                }
            },

            checkLimits: () => {
                const state = get();
                const warnings: string[] = [];

                const geminiPercent = state.geminiCalls / LIMITS.gemini.daily;
                if (geminiPercent >= LIMITS.gemini.warning) {
                    warnings.push(`Gemini API: ${state.geminiCalls}/${LIMITS.gemini.daily} daily calls (${Math.round(geminiPercent * 100)}%)`);
                }

                const tavilyPercent = state.tavilyCalls / LIMITS.tavily.monthly;
                if (tavilyPercent >= LIMITS.tavily.warning) {
                    warnings.push(`Web Search: ${state.tavilyCalls}/${LIMITS.tavily.monthly} monthly calls (${Math.round(tavilyPercent * 100)}%)`);
                }

                const readsPercent = state.firestoreReads / LIMITS.firestoreReads.daily;
                if (readsPercent >= LIMITS.firestoreReads.warning) {
                    warnings.push(`Database reads: ${state.firestoreReads}/${LIMITS.firestoreReads.daily} daily (${Math.round(readsPercent * 100)}%)`);
                }

                const writesPercent = state.firestoreWrites / LIMITS.firestoreWrites.daily;
                if (writesPercent >= LIMITS.firestoreWrites.warning) {
                    warnings.push(`Database writes: ${state.firestoreWrites}/${LIMITS.firestoreWrites.daily} daily (${Math.round(writesPercent * 100)}%)`);
                }

                return { isNearLimit: warnings.length > 0, warnings };
            },

            getUsageStats: () => {
                const state = get();
                return {
                    gemini: {
                        used: state.geminiCalls,
                        limit: LIMITS.gemini.daily,
                        percent: Math.round((state.geminiCalls / LIMITS.gemini.daily) * 100),
                    },
                    tavily: {
                        used: state.tavilyCalls,
                        limit: LIMITS.tavily.monthly,
                        percent: Math.round((state.tavilyCalls / LIMITS.tavily.monthly) * 100),
                    },
                };
            },

            canMakeGeminiCall: () => {
                get().resetIfNeeded();
                return get().geminiCalls < LIMITS.gemini.daily;
            },

            canMakeTavilyCall: () => {
                get().resetIfNeeded();
                return get().tavilyCalls < LIMITS.tavily.monthly;
            },
        }),
        {
            name: 'usage-tracking',
        }
    )
);
