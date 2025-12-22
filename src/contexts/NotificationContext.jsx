// Notification Context
// Manages toast notifications throughout the application

import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

// Notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    // Generate unique ID for notifications
    const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add notification
    const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
        const id = generateId();
        const notification = {
            id,
            message,
            type,
            createdAt: new Date()
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, []);

    // Remove notification by ID
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Convenience methods for different notification types
    const showSuccess = useCallback((message, duration) => {
        return addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
    }, [addNotification]);

    const showError = useCallback((message, duration = 7000) => {
        return addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
    }, [addNotification]);

    const showWarning = useCallback((message, duration) => {
        return addNotification(message, NOTIFICATION_TYPES.WARNING, duration);
    }, [addNotification]);

    const showInfo = useCallback((message, duration) => {
        return addNotification(message, NOTIFICATION_TYPES.INFO, duration);
    }, [addNotification]);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
