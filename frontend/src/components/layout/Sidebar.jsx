// Sidebar Component - Production API Version
import React, { useEffect, useState } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Divider,
    Collapse,
    Badge,
    Tooltip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inbox as InboxIcon,
    Drafts as DraftsIcon,
    Send as SendIcon,
    Archive as ArchiveIcon,
    FolderSpecial as CabinetIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon,
    Mail as MailIcon,
    MailOutline as MailOutlineIcon,
    Search as SearchIcon,
    Add as AddIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    Business as BusinessIcon,
    AccountTree as WorkflowIcon,
    ExpandLess,
    ExpandMore,
    Description as FileIcon,
    ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFiles } from '../../contexts/FileContext';
import { useDaak } from '../../contexts/DaakContext';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 72;

function Sidebar({ open, onClose, onToggle }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    const { getFolderCounts, folderCounts: contextFolderCounts } = useFiles();
    const { getPendingCount } = useDaak();
    const { isAdmin } = useAuth();

    const [daakOpen, setDaakOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [localFolderCounts, setLocalFolderCounts] = useState({});
    const [pendingDaakCount, setPendingDaakCount] = useState(0);

    // Use context folderCounts if available, otherwise use local
    const folderCounts = Object.keys(contextFolderCounts || {}).length > 0 
        ? contextFolderCounts 
        : localFolderCounts;

    // Load folder counts on mount
    useEffect(() => {
        const loadCounts = async () => {
            try {
                const counts = await getFolderCounts();
                setLocalFolderCounts(counts || {});
            } catch (error) {
                console.error('Error loading folder counts:', error);
                setLocalFolderCounts({});
            }
        };
        loadCounts();
    }, [getFolderCounts]);

    // Load pending daak count
    useEffect(() => {
        const loadPendingDaak = async () => {
            try {
                const count = await getPendingCount();
                setPendingDaakCount(count || 0);
            } catch (error) {
                console.error('Error loading pending daak count:', error);
                setPendingDaakCount(0);
            }
        };
        loadPendingDaak();
    }, [getPendingCount]);

    const isSelected = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) {
            onClose();
        }
    };

    const menuItems = [
        {
            label: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/dashboard',
        },
        { divider: true, label: 'Files' },
        {
            label: 'In-Tray',
            icon: <InboxIcon />,
            path: '/files/in-tray',
            badge: folderCounts['in-tray'] || 0,
        },
        {
            label: 'Draft',
            icon: <DraftsIcon />,
            path: '/files/draft',
            badge: folderCounts['draft'] || 0,
        },
        {
            label: 'Sent',
            icon: <SendIcon />,
            path: '/files/sent',
            badge: folderCounts['sent'] || 0,
        },
        {
            label: 'Cabinet',
            icon: <CabinetIcon />,
            path: '/files/cabinet',
            badge: folderCounts['cabinet'] || 0,
        },
        {
            label: 'Shared',
            icon: <ShareIcon />,
            path: '/files/shared',
            badge: folderCounts['shared'] || 0,
        },
        {
            label: 'Tracked',
            icon: <BookmarkIcon />,
            path: '/files/tracked',
            badge: folderCounts['tracked'] || 0,
        },
        {
            label: 'Archived',
            icon: <ArchiveIcon />,
            path: '/files/archived',
            badge: folderCounts['archived'] || 0,
        },
        { divider: true, label: 'Actions' },
        {
            label: 'Create File',
            icon: <AddIcon />,
            path: '/files/create',
            primary: true,
        },
        {
            label: 'Search',
            icon: <SearchIcon />,
            path: '/search',
        },
    ];

    const daakItems = [
        {
            label: 'Inward',
            icon: <MailIcon />,
            path: '/daak/inward',
        },
        {
            label: 'Outward',
            icon: <MailOutlineIcon />,
            path: '/daak/outward',
        },
        {
            label: 'Create Daak',
            icon: <AddIcon />,
            path: '/daak/create',
        },
    ];

    const adminItems = [
        {
            label: 'Users',
            icon: <PeopleIcon />,
            path: '/admin/users',
        },
        {
            label: 'Departments',
            icon: <BusinessIcon />,
            path: '/admin/departments',
        },
        {
            label: 'Workflows',
            icon: <WorkflowIcon />,
            path: '/admin/workflows',
        },
    ];

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Logo/Header */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'space-between' : 'center',
                    minHeight: 64,
                }}
            >
                {open ? (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                            <Typography variant="h6" fontWeight={700} color="primary.main">
                                FLM
                            </Typography>
                        </Box>
                        <Tooltip title="Collapse">
                            <ChevronLeftIcon
                                onClick={onToggle}
                                sx={{ cursor: 'pointer', color: 'text.secondary' }}
                            />
                        </Tooltip>
                    </>
                ) : (
                    <Tooltip title="Expand">
                        <FileIcon
                            onClick={onToggle}
                            sx={{ color: 'primary.main', fontSize: 32, cursor: 'pointer' }}
                        />
                    </Tooltip>
                )}
            </Box>

            <Divider />

            {/* Main Menu */}
            <List sx={{ flex: 1, pt: 1 }}>
                {menuItems.map((item, index) => {
                    if (item.divider) {
                        return open ? (
                            <Box key={index} sx={{ px: 2, py: 1, mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {item.label}
                                </Typography>
                            </Box>
                        ) : (
                            <Divider key={index} sx={{ my: 1 }} />
                        );
                    }

                    return (
                        <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
                            <Tooltip title={open ? '' : item.label} placement="right">
                                <ListItemButton
                                    selected={isSelected(item.path)}
                                    onClick={() => handleNavigate(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        minHeight: 44,
                                        justifyContent: open ? 'initial' : 'center',
                                        px: open ? 2 : 1.5,
                                        bgcolor: item.primary ? 'primary.main' : 'transparent',
                                        color: item.primary ? 'white' : 'inherit',
                                        '&:hover': {
                                            bgcolor: item.primary ? 'primary.dark' : 'action.hover',
                                        },
                                        '&.Mui-selected': {
                                            bgcolor: item.primary ? 'primary.dark' : 'primary.lighter',
                                            '&:hover': {
                                                bgcolor: item.primary ? 'primary.dark' : 'primary.light',
                                            },
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: open ? 40 : 0,
                                            justifyContent: 'center',
                                            color: item.primary ? 'inherit' : (isSelected(item.path) ? 'primary.main' : 'text.secondary'),
                                        }}
                                    >
                                        <Badge
                                            badgeContent={item.badge > 0 ? item.badge : null}
                                            color="error"
                                            max={99}
                                        >
                                            {item.icon}
                                        </Badge>
                                    </ListItemIcon>
                                    {open && (
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontSize: '0.875rem',
                                                fontWeight: isSelected(item.path) ? 600 : 400,
                                            }}
                                        />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    );
                })}

                {/* Daak Section */}
                <ListItem disablePadding sx={{ px: 1 }}>
                    <Tooltip title={open ? '' : 'Daak'} placement="right">
                        <ListItemButton
                            onClick={() => setDaakOpen(!daakOpen)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                minHeight: 44,
                                justifyContent: open ? 'initial' : 'center',
                                px: open ? 2 : 1.5,
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: open ? 40 : 0, justifyContent: 'center' }}>
                                <Badge badgeContent={pendingDaakCount > 0 ? pendingDaakCount : null} color="warning" max={99}>
                                    <MailIcon />
                                </Badge>
                            </ListItemIcon>
                            {open && (
                                <>
                                    <ListItemText
                                        primary="Daak"
                                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    />
                                    {daakOpen ? <ExpandLess /> : <ExpandMore />}
                                </>
                            )}
                        </ListItemButton>
                    </Tooltip>
                </ListItem>

                {open && (
                    <Collapse in={daakOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {daakItems.map((item) => (
                                <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
                                    <ListItemButton
                                        selected={isSelected(item.path)}
                                        onClick={() => handleNavigate(item.path)}
                                        sx={{ borderRadius: 2, mb: 0.5, pl: 4 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>
                )}

                {/* Admin Section */}
                {isAdmin() && (
                    <>
                        <ListItem disablePadding sx={{ px: 1 }}>
                            <Tooltip title={open ? '' : 'Admin'} placement="right">
                                <ListItemButton
                                    onClick={() => setAdminOpen(!adminOpen)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        minHeight: 44,
                                        justifyContent: open ? 'initial' : 'center',
                                        px: open ? 2 : 1.5,
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: open ? 40 : 0, justifyContent: 'center' }}>
                                        <SettingsIcon />
                                    </ListItemIcon>
                                    {open && (
                                        <>
                                            <ListItemText
                                                primary="Admin"
                                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                                            />
                                            {adminOpen ? <ExpandLess /> : <ExpandMore />}
                                        </>
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>

                        {open && (
                            <Collapse in={adminOpen} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {adminItems.map((item) => (
                                        <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
                                            <ListItemButton
                                                selected={isSelected(item.path)}
                                                onClick={() => handleNavigate(item.path)}
                                                sx={{ borderRadius: 2, mb: 0.5, pl: 4 }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    {item.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.label}
                                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                    </>
                )}
            </List>

            {/* Footer */}
            {open && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        FLM v1.0.0
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        © 2024 Enterprise Solutions
                    </Typography>
                </Box>
            )}
        </Box>
    );

    return (
        <>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={isMobile && open}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: DRAWER_WIDTH,
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH,
                        transition: 'width 0.3s',
                        overflowX: 'hidden',
                    },
                }}
                open={open}
            >
                {drawerContent}
            </Drawer>
        </>
    );
}

export default Sidebar;
