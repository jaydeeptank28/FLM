// Empty State Component
// Displays friendly message when no data is available

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

function EmptyState({
    icon: Icon = InboxIcon,
    title = 'No items found',
    description = 'There are no items to display.',
    actionLabel,
    onAction
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 3,
                textAlign: 'center',
            }}
        >
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                }}
            >
                <Icon sx={{ fontSize: 40, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h6" color="text.primary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
                {description}
            </Typography>
            {actionLabel && onAction && (
                <Button variant="contained" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
}

export default EmptyState;
