// localStorage utility hook
import { useState, useEffect } from 'react';

/**
 * Custom hook for syncing state with localStorage
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function]} - [storedValue, setValue]
 */
export function useLocalStorage(key, initialValue) {
    // Get initial value from localStorage or use provided initialValue
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage when state changes
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}

/**
 * Get value from localStorage
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} - The stored value or default
 */
export function getFromStorage(key, defaultValue = null) {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Set value in localStorage
 * @param {string} key - The localStorage key
 * @param {any} value - Value to store
 */
export function setToStorage(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
    }
}

/**
 * Remove key from localStorage
 * @param {string} key - The localStorage key to remove
 */
export function removeFromStorage(key) {
    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
    }
}

/**
 * Clear all FLM-related data from localStorage
 */
export function clearAllFLMData() {
    const flmKeys = ['flm_files', 'flm_daak', 'flm_users', 'flm_current_user', 'flm_current_department'];
    flmKeys.forEach(key => {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    });
}

export default useLocalStorage;
