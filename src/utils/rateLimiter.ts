// Rate limiting utilities

interface RateLimitState {
    requests: number;
    resetTime: number;
}

export const RATE_LIMITS = {
    'gemini-2.0-flash-exp': { rpm: 10, rpd: 1500 },
    'gemini-1.5-flash': { rpm: 15, rpd: 1500 },
    'tavily': { rpm: 60, monthly: 1000 },
} as const;

export type ModelName = keyof typeof RATE_LIMITS;

class RateLimiter {
    private state: Map<string, RateLimitState> = new Map();
    private dailyState: Map<string, { count: number; date: string }> = new Map();

    canMakeRequest(model: ModelName): boolean {
        const limits = RATE_LIMITS[model];
        if (!limits) return true;

        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];

        // Check per-minute limit
        const minuteState = this.state.get(model);
        if (minuteState && now < minuteState.resetTime) {
            if (minuteState.requests >= limits.rpm) {
                return false;
            }
        }

        // Check daily limit
        if ('rpd' in limits) {
            const dayState = this.dailyState.get(model);
            if (dayState && dayState.date === today) {
                if (dayState.count >= limits.rpd) {
                    return false;
                }
            }
        }

        return true;
    }

    recordRequest(model: ModelName): void {
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];

        // Update per-minute state
        const minuteState = this.state.get(model);
        if (!minuteState || now >= minuteState.resetTime) {
            this.state.set(model, { requests: 1, resetTime: now + 60000 });
        } else {
            minuteState.requests++;
        }

        // Update daily state
        const dayState = this.dailyState.get(model);
        if (!dayState || dayState.date !== today) {
            this.dailyState.set(model, { count: 1, date: today });
        } else {
            dayState.count++;
        }
    }

    getWaitTime(model: ModelName): number {
        const state = this.state.get(model);
        if (!state) return 0;
        return Math.max(0, state.resetTime - Date.now());
    }

    getRemainingRequests(model: ModelName): { minute: number; daily: number } {
        const limits = RATE_LIMITS[model];
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];

        const minuteState = this.state.get(model);
        const minuteRemaining = minuteState && now < minuteState.resetTime
            ? limits.rpm - minuteState.requests
            : limits.rpm;

        let dailyRemaining = 'rpd' in limits ? limits.rpd : Infinity;
        const dayState = this.dailyState.get(model);
        if (dayState && dayState.date === today && 'rpd' in limits) {
            dailyRemaining = limits.rpd - dayState.count;
        }

        return { minute: minuteRemaining, daily: dailyRemaining };
    }
}

export const rateLimiter = new RateLimiter();

// Retry with exponential backoff
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        shouldRetry?: (error: Error) => boolean;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        shouldRetry = (error: Error) => {
            // Retry on rate limits and server errors
            const message = error.message.toLowerCase();
            return message.includes('429') ||
                message.includes('500') ||
                message.includes('503') ||
                message.includes('timeout');
        },
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (!shouldRetry(lastError) || attempt === maxRetries - 1) {
                throw lastError;
            }

            const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            const jitter = delay * 0.1 * Math.random();

            await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
    }

    throw lastError;
}

// Debounce utility
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// Throttle utility
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
