// Main Layout Component
// Wraps authenticated pages with Header and Sidebar

import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import NotificationDisplay from '../common/NotificationDisplay';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 72;

function MainLayout() {
    const { isAuthenticated, isLoading, needsDepartmentSelection } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleSidebarClose = () => {
        setSidebarOpen(false);
    };

    // Show loading state
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                Loading...
            </Box>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        // if (needsDepartmentSelection) {
        //     return <Navigate to="/select-department" replace />;
        // }
        return <Navigate to="/login" replace />;
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Sidebar */}
            <Sidebar
                open={sidebarOpen}
                onClose={handleSidebarClose}
                onToggle={handleSidebarToggle}
            />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { xs: '100%', md: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH}px)` },
                    ml: { xs: 0, md: `${sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH}px` },
                    transition: 'width 0.3s, margin-left 0.3s',
                    minHeight: '100vh',
                }}
            >
                {/* Header */}
                <Header open={sidebarOpen} onMenuClick={handleSidebarToggle} />

                {/* Toolbar spacer */}
                <Toolbar />

                {/* Page Content */}
                <Box sx={{ p: 3 }}>
                    <Outlet />
                </Box>
            </Box>

            {/* Global Notifications */}
            <NotificationDisplay />
        </Box>
    );
}

export default MainLayout;
