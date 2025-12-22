// Dashboard Page - Production API Version
import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    CircularProgress,
    Skeleton
} from '@mui/material';
import {
    Inbox as InboxIcon,
    Drafts as DraftsIcon,
    Send as SendIcon,
    Archive as ArchiveIcon,
    FolderSpecial as CabinetIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon,
    Add as AddIcon,
    ArrowForward as ArrowForwardIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFiles } from '../../contexts/FileContext';
import StateBadge from '../../components/common/StateBadge';
import PriorityChip from '../../components/common/PriorityChip';

function DashboardPage() {
    const navigate = useNavigate();
    const { currentUser, currentDepartment, currentRole } = useAuth();
    const { getFolderCounts, fetchFilesByFolder, loading } = useFiles();
    
    const [folderCounts, setFolderCounts] = useState({});
    const [inTrayFiles, setInTrayFiles] = useState([]);
    const [recentFiles, setRecentFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                // Load folder counts
                const counts = await getFolderCounts();
                setFolderCounts(counts);

                // Load in-tray files
                const inTray = await fetchFilesByFolder('in-tray');
                setInTrayFiles(inTray.slice(0, 5));

                // Load sent files (recent)
                const sent = await fetchFilesByFolder('sent');
                setRecentFiles(sent.slice(0, 5));
            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [getFolderCounts, fetchFilesByFolder]);

    const folders = [
        { key: 'in-tray', label: 'In-Tray', icon: InboxIcon, color: '#1976d2', path: '/files/in-tray' },
        { key: 'draft', label: 'Draft', icon: DraftsIcon, color: '#ed6c02', path: '/files/draft' },
        { key: 'sent', label: 'Sent', icon: SendIcon, color: '#2e7d32', path: '/files/sent' },
        { key: 'cabinet', label: 'Cabinet', icon: CabinetIcon, color: '#7c4dff', path: '/files/cabinet' },
        { key: 'shared', label: 'Shared', icon: ShareIcon, color: '#0288d1', path: '/files/shared' },
        { key: 'tracked', label: 'Tracked', icon: BookmarkIcon, color: '#d32f2f', path: '/files/tracked' },
        { key: 'archived', label: 'Archived', icon: ArchiveIcon, color: '#666666', path: '/files/archived' },
    ];

    return (
        <Box>
            {/* Welcome Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Welcome back, {currentUser?.name?.split(' ')[0]}!
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={currentDepartment} color="primary" size="small" />
                    <Chip label={currentRole} variant="outlined" size="small" />
                </Box>
            </Box>

            {/* Quick Actions */}
            <Box sx={{ mb: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/files/create')}
                    sx={{ mr: 2 }}
                >
                    Create New File
                </Button>
            </Box>

            {/* Folder Cards */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Your Folders
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {folders.map((folder) => {
                    const Icon = folder.icon;
                    const count = folderCounts[folder.key] || 0;

                    return (
                        <Grid item xs={6} sm={4} md={3} lg={12 / 7} key={folder.key}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    },
                                }}
                                onClick={() => navigate(folder.path)}
                            >
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 2,
                                                bgcolor: `${folder.color}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Icon sx={{ color: folder.color }} />
                                        </Box>
                                        {isLoading ? (
                                            <Skeleton width={30} height={40} />
                                        ) : (
                                            <Typography variant="h5" fontWeight={700} color={folder.color}>
                                                {count}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {folder.label}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Tables Grid */}
            <Grid container spacing={3}>
                {/* In-Tray Files */}
                <Grid item xs={12} lg={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    Pending in In-Tray
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate('/files/in-tray')}
                                >
                                    View All
                                </Button>
                            </Box>

                            {isLoading ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : inTrayFiles.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No pending files in your In-Tray
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>File Number</TableCell>
                                                <TableCell>Subject</TableCell>
                                                <TableCell>Priority</TableCell>
                                                <TableCell align="right">Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {inTrayFiles.map((file) => (
                                                <TableRow key={file.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {file.file_number || file.fileNumber}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                maxWidth: 200,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {file.subject}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <PriorityChip priority={file.priority} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="View File">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/files/view/${file.id}`)}
                                                            >
                                                                <ViewIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12} lg={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    Recent Files
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate('/files/sent')}
                                >
                                    View All
                                </Button>
                            </Box>

                            {isLoading ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : recentFiles.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No recent files
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>File Number</TableCell>
                                                <TableCell>Subject</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {recentFiles.map((file) => (
                                                <TableRow key={file.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {file.file_number || file.fileNumber}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                maxWidth: 200,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {file.subject}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StateBadge state={file.current_state || file.currentState} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="View File">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/files/view/${file.id}`)}
                                                            >
                                                                <ViewIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DashboardPage;
