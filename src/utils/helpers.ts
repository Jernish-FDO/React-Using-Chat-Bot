// Input validation and sanitization utilities

/**
 * Sanitize user input to prevent XSS and limit size
 */
export function sanitizeUserInput(input: string, maxLength = 10000): string {
    return input
        .trim()
        .slice(0, maxLength)
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove other potentially dangerous tags
        .replace(/<(iframe|object|embed|link|meta|style)[^>]*>/gi, '')
        // Remove javascript: URLs
        .replace(/javascript:/gi, '');
}

/**
 * Validate a search query for web search
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: 'Search query cannot be empty' };
    }

    if (trimmed.length < 2) {
        return { valid: false, error: 'Search query is too short' };
    }

    if (trimmed.length > 500) {
        return { valid: false, error: 'Search query is too long (max 500 characters)' };
    }

    // Check for potentially sensitive terms that shouldn't be searched
    const sensitiveTerms = ['api_key', 'password', 'secret', 'credential', 'private_key'];
    const lowerQuery = trimmed.toLowerCase();
    for (const term of sensitiveTerms) {
        if (lowerQuery.includes(term)) {
            return { valid: false, error: 'Query contains sensitive terms' };
        }
    }

    return { valid: true };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

/**
 * Format a duration in milliseconds
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}
/**
 * Deeply remove undefined values and serialize Dates for Firestore
 */
export function sanitizeForFirestore<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (obj instanceof Date) {
        return obj.toISOString() as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
        const result: any = {};
        let hasKeys = false;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = (obj as any)[key];
                if (value !== undefined) {
                    result[key] = sanitizeForFirestore(value);
                    hasKeys = true;
                }
            }
        }
        return result as T;
    }

    return obj;
}
