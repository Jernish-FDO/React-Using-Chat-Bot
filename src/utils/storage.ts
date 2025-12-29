// Storage utilities for local persistence

const STORAGE_PREFIX = 'ai-assistant:';

export function getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
}

export function setItem<T>(key: string, value: T): void {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(getStorageKey(key), serialized);
    } catch (error) {
        console.error(`Failed to save to localStorage: ${key}`, error);
    }
}

export function getItem<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(getStorageKey(key));
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
    } catch (error) {
        console.error(`Failed to read from localStorage: ${key}`, error);
        return defaultValue;
    }
}

export function removeItem(key: string): void {
    try {
        localStorage.removeItem(getStorageKey(key));
    } catch (error) {
        console.error(`Failed to remove from localStorage: ${key}`, error);
    }
}

export function clearAll(): void {
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
        keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Failed to clear localStorage', error);
    }
}

// Session storage utilities
export function setSessionItem<T>(key: string, value: T): void {
    try {
        const serialized = JSON.stringify(value);
        sessionStorage.setItem(getStorageKey(key), serialized);
    } catch (error) {
        console.error(`Failed to save to sessionStorage: ${key}`, error);
    }
}

export function getSessionItem<T>(key: string, defaultValue: T): T {
    try {
        const item = sessionStorage.getItem(getStorageKey(key));
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
    } catch (error) {
        console.error(`Failed to read from sessionStorage: ${key}`, error);
        return defaultValue;
    }
}
