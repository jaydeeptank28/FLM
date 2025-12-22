// Notification Display Component
// Shows toast notifications from NotificationContext

import React from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useNotification } from '../../contexts/NotificationContext';

function NotificationDisplay() {
    const { notifications, removeNotification } = useNotification();

    return (
        <Stack
            spacing={1}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 2000,
                maxWidth: 400,
            }}
        >
            {notifications.map((notification) => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    sx={{ position: 'relative', bottom: 'auto', right: 'auto' }}
                >
                    <Alert
                        severity={notification.type}
                        onClose={() => removeNotification(notification.id)}
                        variant="filled"
                        sx={{
                            width: '100%',
                            boxShadow: 3,
                        }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            ))}
        </Stack>
    );
}

export default NotificationDisplay;
