// Header Component
import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Box,
    Avatar,
    Chip,
    Tooltip,
    Divider,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    SwapHoriz as SwapHorizIcon,
    Search as SearchIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 260;

function Header({ open, onMenuClick }) {
    const navigate = useNavigate();
    const { currentUser, currentDepartment, currentDepartmentId, currentRole, logout, getUserDepartments, selectDepartment } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [deptAnchorEl, setDeptAnchorEl] = useState(null);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeptMenuOpen = (event) => {
        setDeptAnchorEl(event.currentTarget);
    };

    const handleDeptMenuClose = () => {
        setDeptAnchorEl(null);
    };

    const handleLogout = () => {
        handleProfileMenuClose();
        logout();
        navigate('/login');
    };

    const handleSwitchDepartment = (deptId) => {
        selectDepartment(deptId);
        handleDeptMenuClose();
        // Reload page to refresh all data for new department
        window.location.reload();
    };

    const handleSearch = () => {
        navigate('/search');
    };

    const userDepartments = getUserDepartments();
    const canSwitchDepartment = userDepartments.length > 1;

    return (
        <AppBar
            position="fixed"
            sx={{
                width: { md: `calc(100% - ${open ? DRAWER_WIDTH : 72}px)` },
                ml: { md: `${open ? DRAWER_WIDTH : 72}px` },
                transition: 'width 0.3s, margin-left 0.3s',
                backgroundColor: 'background.paper',
                color: 'text.primary',
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={onMenuClick}
                        sx={{ display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                            File Lifecycle Management
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Enterprise Document Workflow System
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Search Button */}
                    <Tooltip title="Search">
                        <IconButton color="inherit" onClick={handleSearch}>
                            <SearchIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Department Dropdown - Always clickable if multiple departments */}
                    {currentDepartment && (
                        <Chip
                            label={currentDepartment}
                            color="primary"
                            variant={canSwitchDepartment ? 'filled' : 'outlined'}
                            size="small"
                            onClick={canSwitchDepartment ? handleDeptMenuOpen : undefined}
                            sx={{ cursor: canSwitchDepartment ? 'pointer' : 'default' }}
                            icon={canSwitchDepartment ? <SwapHorizIcon /> : undefined}
                        />
                    )}

                    {/* User Menu */}
                    <Tooltip title="Account">
                        <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 1 }}>
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: 'primary.main',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {currentUser?.name?.charAt(0) || 'U'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Profile Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleProfileMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                        sx: { width: 240, mt: 1 }
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {currentUser?.name || 'User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {currentRole} • {currentDepartment}
                        </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={handleProfileMenuClose}>
                        <ListItemIcon>
                            <SettingsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Settings</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText sx={{ color: 'error.main' }}>Logout</ListItemText>
                    </MenuItem>
                </Menu>

                {/* Department Switch Dropdown */}
                <Menu
                    anchorEl={deptAnchorEl}
                    open={Boolean(deptAnchorEl)}
                    onClose={handleDeptMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                        sx: { minWidth: 180, mt: 1 }
                    }}
                >
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Switch Department
                        </Typography>
                    </Box>
                    <Divider />
                    {userDepartments.map((dept) => (
                        <MenuItem
                            key={dept.id}
                            selected={dept.id === currentDepartmentId}
                            onClick={() => handleSwitchDepartment(dept.id)}
                        >
                            <ListItemIcon>
                                {dept.id === currentDepartmentId && <CheckIcon fontSize="small" color="primary" />}
                            </ListItemIcon>
                            <ListItemText>
                                <Typography variant="body2" fontWeight={dept.id === currentDepartmentId ? 600 : 400}>
                                    {dept.name || dept.code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {dept.role}
                                </Typography>
                            </ListItemText>
                        </MenuItem>
                    ))}
                </Menu>
            </Toolbar>
        </AppBar>
    );
}

export default Header;

