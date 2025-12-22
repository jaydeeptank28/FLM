// File List Page - Shows files based on folder type
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Button,
    Chip
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Add as AddIcon,
    Inbox as InboxIcon,
    Drafts as DraftsIcon,
    Send as SendIcon,
    Archive as ArchiveIcon,
    FolderSpecial as CabinetIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useFiles } from '../../contexts/FileContext';
import StateBadge from '../../components/common/StateBadge';
import PriorityChip from '../../components/common/PriorityChip';
import EmptyState from '../../components/common/EmptyState';
import { FOLDER_LABELS } from '../../utils/constants';
import { users } from '../../data/users';

const folderIcons = {
    'in-tray': InboxIcon,
    'draft': DraftsIcon,
    'sent': SendIcon,
    'cabinet': CabinetIcon,
    'shared': ShareIcon,
    'tracked': BookmarkIcon,
    'archived': ArchiveIcon
};

function FileListPage() {
    const { folder } = useParams();
    const navigate = useNavigate();
    const { getFilesByFolder } = useFiles();

    const files = useMemo(() => getFilesByFolder(folder), [folder, getFilesByFolder]);

    const FolderIcon = folderIcons[folder] || InboxIcon;
    const folderLabel = FOLDER_LABELS[folder] || 'Files';

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user?.name || 'Unknown';
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
        } catch {
            return dateString;
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FolderIcon sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            {folderLabel}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {files.length} file{files.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </Box>

                {folder === 'draft' && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/files/create')}
                    >
                        Create File
                    </Button>
                )}
            </Box>

            {/* Files Table */}
            <Card>
                {files.length === 0 ? (
                    <EmptyState
                        icon={FolderIcon}
                        title={`No files in ${folderLabel}`}
                        description={folder === 'draft' ? 'Create a new file to get started.' : 'Files will appear here when available.'}
                        actionLabel={folder === 'draft' ? 'Create File' : undefined}
                        onAction={folder === 'draft' ? () => navigate('/files/create') : undefined}
                    />
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>File Number</TableCell>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Department</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created By</TableCell>
                                    <TableCell>Updated</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {files.map((file) => (
                                    <TableRow
                                        key={file.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/files/view/${file.id}`)}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                {file.fileNumber}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 250,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {file.subject}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={file.fileType} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{file.department}</TableCell>
                                        <TableCell>
                                            <PriorityChip priority={file.priority} />
                                        </TableCell>
                                        <TableCell>
                                            <StateBadge state={file.currentState} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{getUserName(file.createdBy)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(file.updatedAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View File">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/files/view/${file.id}`);
                                                    }}
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
            </Card>
        </Box>
    );
}

export default FileListPage;
