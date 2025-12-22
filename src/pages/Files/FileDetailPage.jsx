// File Detail Page - Comprehensive file view with 5 tabs
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Tabs,
    Tab,
    Button,
    IconButton,
    Chip,
    Divider,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Description as FileIcon,
    AttachFile as AttachFileIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as ApproveIcon,
    Undo as ReturnIcon,
    Pause as HoldIcon,
    Cancel as RejectIcon,
    Archive as ArchiveIcon,
    Send as SendIcon,
    Refresh as ResubmitIcon,
    PlayArrow as ResumeIcon,
    Edit as EditIcon,
    Download as DownloadIcon,
    History as HistoryIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useFiles } from '../../contexts/FileContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import StateBadge from '../../components/common/StateBadge';
import PriorityChip from '../../components/common/PriorityChip';
import EmptyState from '../../components/common/EmptyState';
import { WORKFLOW_ACTIONS, WORKFLOW_ACTION_LABELS, FILE_STATES } from '../../utils/constants';
import { users } from '../../data/users';

// Tab Panel Component
function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

function FileDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getFileById, getAllowedActions, performWorkflowAction, addNoting, addDocument, toggleTrackFile } = useFiles();
    const { currentUser } = useAuth();
    const { showSuccess, showError } = useNotification();

    const [tabValue, setTabValue] = useState(0);
    const [actionDialog, setActionDialog] = useState({ open: false, action: null });
    const [remarks, setRemarks] = useState('');
    const [newNoting, setNewNoting] = useState('');

    const file = useMemo(() => getFileById(id), [id, getFileById]);
    const allowedActions = useMemo(() => file ? getAllowedActions(file) : [], [file, getAllowedActions]);

    if (!file) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6">File not found</Typography>
                <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

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

    const isReadOnly = file.currentState === FILE_STATES.ARCHIVED || file.currentState === FILE_STATES.REJECTED;
    const isTracking = file.trackedBy?.includes(currentUser?.id);

    const handleAction = (action) => {
        setActionDialog({ open: true, action });
        setRemarks('');
    };

    const confirmAction = () => {
        const success = performWorkflowAction(file.id, actionDialog.action, remarks);
        if (success) {
            showSuccess(`Action "${WORKFLOW_ACTION_LABELS[actionDialog.action]}" completed successfully`);
        } else {
            showError('Action failed. Please try again.');
        }
        setActionDialog({ open: false, action: null });
    };

    const handleAddNoting = () => {
        if (!newNoting.trim()) return;
        addNoting(file.id, newNoting, 'NOTING');
        setNewNoting('');
        showSuccess('Noting added successfully');
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(f => {
            addDocument(file.id, {
                name: f.name,
                size: f.size,
                type: 'NORMAL'
            });
        });
        showSuccess(`${files.length} document(s) added`);
    };

    const actionButtons = {
        [WORKFLOW_ACTIONS.SUBMIT]: { icon: <SendIcon />, color: 'primary' },
        [WORKFLOW_ACTIONS.APPROVE]: { icon: <ApproveIcon />, color: 'success' },
        [WORKFLOW_ACTIONS.RETURN]: { icon: <ReturnIcon />, color: 'warning' },
        [WORKFLOW_ACTIONS.RESUBMIT]: { icon: <ResubmitIcon />, color: 'primary' },
        [WORKFLOW_ACTIONS.HOLD]: { icon: <HoldIcon />, color: 'secondary' },
        [WORKFLOW_ACTIONS.RESUME]: { icon: <ResumeIcon />, color: 'primary' },
        [WORKFLOW_ACTIONS.REJECT]: { icon: <RejectIcon />, color: 'error' },
        [WORKFLOW_ACTIONS.ARCHIVE]: { icon: <ArchiveIcon />, color: 'secondary' }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h5" fontWeight={700}>
                                {file.fileNumber}
                            </Typography>
                            <StateBadge state={file.currentState} />
                            <PriorityChip priority={file.priority} />
                        </Box>
                        <Typography variant="body1" color="text.secondary">
                            {file.subject}
                        </Typography>
                    </Box>
                </Box>

                {/* Track Button */}
                <Button
                    variant={isTracking ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => toggleTrackFile(file.id)}
                >
                    {isTracking ? 'Tracking' : 'Track'}
                </Button>
            </Box>

            {/* Read-only Alert */}
            {isReadOnly && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    This file is in {file.currentState} state and is read-only.
                </Alert>
            )}

            {/* Action Buttons */}
            {allowedActions.length > 0 && !isReadOnly && (
                <Card sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Available Actions:
                        </Typography>
                        {allowedActions.map((action) => {
                            const config = actionButtons[action] || { color: 'primary' };
                            return (
                                <Button
                                    key={action}
                                    variant="contained"
                                    color={config.color}
                                    startIcon={config.icon}
                                    onClick={() => handleAction(action)}
                                    size="small"
                                >
                                    {WORKFLOW_ACTION_LABELS[action]}
                                </Button>
                            );
                        })}
                    </Box>
                </Card>
            )}

            {/* Tabs */}
            <Card>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab label="Basic Information" />
                    <Tab label="Notings" />
                    <Tab label="Documents" />
                    <Tab label="Workflow" />
                    <Tab label="Audit Trail" />
                </Tabs>

                <CardContent>
                    {/* Tab 1: Basic Information */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">File Number</Typography>
                                <Typography variant="body1" fontWeight={500}>{file.fileNumber}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                                <Typography variant="body1">{file.department}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">File Type</Typography>
                                <Chip label={file.fileType} size="small" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                                <PriorityChip priority={file.priority} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                <Typography variant="body1">{getUserName(file.createdBy)}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                <Typography variant="body1">{formatDate(file.createdAt)}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                                <StateBadge state={file.currentState} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                                <Typography variant="body1">{formatDate(file.updatedAt)}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                                <Typography variant="body1">{file.subject}</Typography>
                            </Grid>

                            {/* Attribute History */}
                            {file.attributeHistory.length > 0 && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Attribute Changes
                                    </Typography>
                                    <List dense>
                                        {file.attributeHistory.map((change, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemText
                                                    primary={`${change.field}: "${change.oldValue}" → "${change.newValue}"`}
                                                    secondary={`Changed by ${getUserName(change.changedBy)} on ${formatDate(change.changedAt)}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            )}
                        </Grid>
                    </TabPanel>

                    {/* Tab 2: Notings */}
                    <TabPanel value={tabValue} index={1}>
                        {/* Add Noting */}
                        {!isReadOnly && (
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Add a new noting..."
                                    value={newNoting}
                                    onChange={(e) => setNewNoting(e.target.value)}
                                    sx={{ mb: 1 }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleAddNoting}
                                    disabled={!newNoting.trim()}
                                >
                                    Add Noting
                                </Button>
                            </Box>
                        )}

                        {/* Notings List */}
                        {file.notings.length === 0 ? (
                            <EmptyState
                                icon={EditIcon}
                                title="No notings yet"
                                description="Add the first noting to this file."
                            />
                        ) : (
                            <List>
                                {[...file.notings].reverse().map((noting) => (
                                    <ListItem
                                        key={noting.id}
                                        sx={{
                                            bgcolor: 'grey.50',
                                            borderRadius: 2,
                                            mb: 2,
                                            flexDirection: 'column',
                                            alignItems: 'flex-start'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
                                            <Chip label={noting.type} size="small" variant="outlined" />
                                            <Typography variant="caption" color="text.secondary">
                                                {getUserName(noting.addedBy)} • {formatDate(noting.addedAt)}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {noting.content}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </TabPanel>

                    {/* Tab 3: Documents */}
                    <TabPanel value={tabValue} index={2}>
                        {/* Upload Button */}
                        {!isReadOnly && (
                            <Box sx={{ mb: 3 }}>
                                <input
                                    type="file"
                                    id="doc-upload"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="doc-upload">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<AttachFileIcon />}
                                    >
                                        Upload Document
                                    </Button>
                                </label>
                            </Box>
                        )}

                        {/* Documents List */}
                        {file.documents.length === 0 ? (
                            <EmptyState
                                icon={FileIcon}
                                title="No documents attached"
                                description="Upload documents to this file."
                            />
                        ) : (
                            file.documents.map((doc) => (
                                <Accordion key={doc.id} sx={{ mb: 1 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <FileIcon color="primary" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight={500}>{doc.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {doc.versions.length} version(s) • Type: {doc.type}
                                                </Typography>
                                            </Box>
                                            <Chip label={`v${doc.versions.length}`} size="small" />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="subtitle2" gutterBottom>Version History</Typography>
                                        <List dense>
                                            {[...doc.versions].reverse().map((version) => (
                                                <ListItem key={version.version}>
                                                    <ListItemIcon>
                                                        <HistoryIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={`Version ${version.version}`}
                                                        secondary={`${getUserName(version.uploadedBy)} • ${formatDate(version.uploadedAt)} • ${(version.size / 1024).toFixed(1)} KB`}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton size="small">
                                                            <DownloadIcon fontSize="small" />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            ))
                        )}
                    </TabPanel>

                    {/* Tab 4: Workflow */}
                    <TabPanel value={tabValue} index={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="text.secondary">Current Level</Typography>
                                    <Typography variant="h3" fontWeight={700} color="primary.main">
                                        {file.workflow.currentLevel}
                                    </Typography>
                                    <Typography variant="body2">of {file.workflow.maxLevels} levels</Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Workflow Participants
                                </Typography>
                                {file.workflow.participants.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        No workflow actions taken yet.
                                    </Typography>
                                ) : (
                                    <List>
                                        {file.workflow.participants.map((participant, idx) => (
                                            <ListItem key={idx} sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 1 }}>
                                                <ListItemIcon>
                                                    <PersonIcon />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography fontWeight={500}>Level {participant.level}: {participant.role}</Typography>
                                                            <Chip
                                                                label={participant.action}
                                                                size="small"
                                                                color={participant.action === 'APPROVED' ? 'success' : participant.action === 'RETURNED' ? 'warning' : 'default'}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2">
                                                                By: {getUserName(participant.actionBy)} • {formatDate(participant.actionAt)}
                                                            </Typography>
                                                            {participant.remarks && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                    "{participant.remarks}"
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 5: Audit Trail */}
                    <TabPanel value={tabValue} index={4}>
                        {file.auditTrail.length === 0 ? (
                            <EmptyState
                                icon={HistoryIcon}
                                title="No audit entries"
                                description="Actions on this file will be logged here."
                            />
                        ) : (
                            <List>
                                {[...file.auditTrail].reverse().map((entry) => (
                                    <ListItem
                                        key={entry.id}
                                        sx={{
                                            bgcolor: 'grey.50',
                                            borderRadius: 1,
                                            mb: 1,
                                            borderLeft: 4,
                                            borderColor: 'primary.main'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip label={entry.action} size="small" variant="outlined" />
                                                    <Typography variant="body2">{entry.details}</Typography>
                                                </Box>
                                            }
                                            secondary={`${getUserName(entry.performedBy)} • ${formatDate(entry.performedAt)}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </TabPanel>
                </CardContent>
            </Card>

            {/* Action Dialog */}
            <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, action: null })} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Confirm Action: {WORKFLOW_ACTION_LABELS[actionDialog.action]}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        You are about to perform "{WORKFLOW_ACTION_LABELS[actionDialog.action]}" on file {file.fileNumber}.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Remarks (optional)"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add any remarks or comments..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog({ open: false, action: null })}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={confirmAction}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default FileDetailPage;
