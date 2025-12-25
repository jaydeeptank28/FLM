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
    const { currentUser, currentDepartment, currentDepartmentId, currentRole, logout, getUserDepartments, getAllDepartments, selectDepartment } = useAuth();
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

    // Admin sees all departments, others see only assigned departments
    const isAdmin = currentRole === 'Admin';
    const userDepartments = getUserDepartments();
    const allDepartments = getAllDepartments();
    const departmentsToShow = isAdmin ? allDepartments : userDepartments;
    const canSwitchDepartment = departmentsToShow.length > 1 || isAdmin;

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatRole = (role) => {
        if (!role) return '';
        return role.replace(/_/g, ' ');
    };

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
                            ezFile Lifecycle Management
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
                                {getInitials(currentUser?.name)}
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
                            {formatRole(currentRole)} • {currentDepartment}
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
                    {departmentsToShow.map((dept) => (
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
                                    {formatRole(dept.role)}
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

