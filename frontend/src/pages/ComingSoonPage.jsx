// Coming Soon Page - Placeholder for future features
import React from 'react';
import { Box, Typography, Container, Chip } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

function ComingSoonPage() {
    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '70vh',
                    textAlign: 'center',
                    py: 4
                }}
            >
                <ConstructionIcon sx={{ fontSize: 100, color: 'warning.main', mb: 3 }} />
                
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Coming Soon
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                    We're working hard to bring you this feature. Stay tuned for updates!
                </Typography>

                <Chip 
                    label="Import / Export" 
                    color="primary" 
                    variant="outlined" 
                    sx={{ fontWeight: 600 }}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
                    This feature will allow you to import and export files and data.
                </Typography>
            </Box>
        </Container>
    );
}

export default ComingSoonPage;
