// File Detail Page - Production API Version
import React, { useState, useEffect } from 'react';
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
    Alert,
    CircularProgress,
    Skeleton
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

// Tab Panel Component
function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

function FileDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getFileById, performWorkflowAction, addNoting, addDocument, toggleTrack, loading } = useFiles();
    const { currentUser } = useAuth();
    const { showSuccess, showError } = useNotification();

    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [actionDialog, setActionDialog] = useState({ open: false, action: null });
    const [remarks, setRemarks] = useState('');
    const [newNoting, setNewNoting] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const loadFile = async () => {
            setIsLoading(true);
            try {
                const fileData = await getFileById(id);
                setFile(fileData);
            } catch (error) {
                console.error('Error loading file:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFile();
    }, [id, getFileById]);

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
        } catch {
            return dateString || 'N/A';
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ py: 4 }}>
                <Skeleton variant="text" width={300} height={40} />
                <Skeleton variant="text" width={500} height={30} />
                <Skeleton variant="rectangular" height={400} sx={{ mt: 3 }} />
            </Box>
        );
    }

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

    const currentState = file.current_state || file.currentState;
    const fileNumber = file.file_number || file.fileNumber;
    const fileType = file.file_type || file.fileType;
    const departmentCode = file.department_code || file.department;
    const createdByName = file.created_by_name || file.creator?.name || 'Unknown';
    const createdAt = file.created_at || file.createdAt;
    const updatedAt = file.updated_at || file.updatedAt;
    const notings = file.notings || [];
    const documents = file.documents || [];
    const auditTrail = file.auditTrail || [];
    const workflowParticipants = file.workflowParticipants || [];
    const allowedActions = file.allowedActions || [];
    const attributeHistory = file.attributeHistory || [];

    const isReadOnly = currentState === FILE_STATES.ARCHIVED || currentState === FILE_STATES.REJECTED;
    const isTracking = file.isTracked || false;

    const handleAction = (action) => {
        setActionDialog({ open: true, action });
        setRemarks('');
    };

    const confirmAction = async () => {
        setActionLoading(true);
        try {
            const result = await performWorkflowAction(file.id, actionDialog.action, remarks);
            if (result.success) {
                showSuccess(`Action "${WORKFLOW_ACTION_LABELS[actionDialog.action]}" completed successfully`);
                setFile(result.file);
            } else {
                showError(result.error || 'Action failed. Please try again.');
            }
        } catch (error) {
            showError('Action failed. Please try again.');
        } finally {
            setActionLoading(false);
            setActionDialog({ open: false, action: null });
        }
    };

    const handleAddNoting = async () => {
        if (!newNoting.trim()) return;
        try {
            const result = await addNoting(file.id, newNoting, 'NOTING');
            if (result.success) {
                setFile(result.file);
                setNewNoting('');
                showSuccess('Noting added successfully');
            } else {
                showError(result.error || 'Failed to add noting');
            }
        } catch (error) {
            showError('Failed to add noting');
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        for (const f of files) {
            try {
                const result = await addDocument(file.id, {
                    name: f.name,
                    size: f.size,
                    type: 'NORMAL'
                });
                if (result.success) {
                    setFile(result.file);
                }
            } catch (error) {
                console.error('Error uploading document:', error);
            }
        }
        showSuccess(`${files.length} document(s) added`);
    };

    const handleToggleTrack = async () => {
        try {
            const result = await toggleTrack(file.id);
            if (result.success) {
                setFile(result.file);
                showSuccess(result.file.isTracked ? 'File tracked' : 'File untracked');
            }
        } catch (error) {
            showError('Failed to update track status');
        }
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
                                {fileNumber}
                            </Typography>
                            <StateBadge state={currentState} />
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
                    onClick={handleToggleTrack}
                >
                    {isTracking ? 'Tracking' : 'Track'}
                </Button>
            </Box>

            {/* Read-only Alert */}
            {isReadOnly && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    This file is in {currentState} state and is read-only.
                </Alert>
            )}

            {/* Action Buttons */}
            {allowedActions.length > 0 && !isReadOnly && (
                <Card sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
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
                    {/* Context-aware help text */}
                    <Typography variant="caption" color="text.secondary">
                        {currentState === FILE_STATES.DRAFT && '💡 Submit this file to start the approval workflow.'}
                        {currentState === FILE_STATES.IN_REVIEW && `💡 Level ${file.current_workflow_level || file.current_level || 1} of ${file.max_workflow_levels || file.max_levels || 3}. Approve to move forward, Return to send back to creator.`}
                        {currentState === FILE_STATES.RETURNED && '💡 File was returned for corrections. Make changes and Resubmit.'}
                        {currentState === FILE_STATES.APPROVED && '💡 File is fully approved! Click Archive to complete the workflow and store permanently.'}
                        {currentState === FILE_STATES.CABINET && '💡 File is on hold. Click Resume to continue the approval process.'}
                    </Typography>
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
                                <Typography variant="body1" fontWeight={500}>{fileNumber}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                                <Typography variant="body1">{departmentCode}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">File Type</Typography>
                                <Chip label={fileType} size="small" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                                <PriorityChip priority={file.priority} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                <Typography variant="body1">{createdByName}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                <Typography variant="body1">{formatDate(createdAt)}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                                <StateBadge state={currentState} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                                <Typography variant="body1">{formatDate(updatedAt)}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                                <Typography variant="body1">{file.subject}</Typography>
                            </Grid>

                            {/* Attribute History */}
                            {attributeHistory.length > 0 && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Attribute Changes
                                    </Typography>
                                    <List dense>
                                        {attributeHistory.map((change, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemText
                                                    primary={`${change.field}: "${change.old_value}" → "${change.new_value}"`}
                                                    secondary={`Changed by ${change.changed_by_name || 'Unknown'} on ${formatDate(change.changed_at)}`}
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
                                    disabled={!newNoting.trim() || loading}
                                >
                                    Add Noting
                                </Button>
                            </Box>
                        )}

                        {/* Notings List */}
                        {notings.length === 0 ? (
                            <EmptyState
                                icon={EditIcon}
                                title="No notings yet"
                                description="Add the first noting to this file."
                            />
                        ) : (
                            <List>
                                {[...notings].reverse().map((noting) => (
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
                                                {noting.added_by_name || 'Unknown'} • {formatDate(noting.added_at || noting.addedAt)}
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
                        {documents.length === 0 ? (
                            <EmptyState
                                icon={FileIcon}
                                title="No documents attached"
                                description="Upload documents to this file."
                            />
                        ) : (
                            documents.map((doc) => (
                                <Accordion key={doc.id} sx={{ mb: 1 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <FileIcon color="primary" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight={500}>{doc.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {doc.versions?.length || 1} version(s) • Type: {doc.type}
                                                </Typography>
                                            </Box>
                                            <Chip label={`v${doc.current_version || 1}`} size="small" />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="subtitle2" gutterBottom>Version History</Typography>
                                        <List dense>
                                            {(doc.versions || []).map((version) => (
                                                <ListItem key={version.version}>
                                                    <ListItemIcon>
                                                        <HistoryIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={`Version ${version.version}`}
                                                        secondary={`${version.uploaded_by_name || 'Unknown'} • ${formatDate(version.uploaded_at)} • ${(version.size / 1024).toFixed(1)} KB`}
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
                                        {file.current_workflow_level || 0}
                                    </Typography>
                                    <Typography variant="body2">of {file.max_workflow_levels || 3} levels</Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Workflow Participants
                                </Typography>
                                {workflowParticipants.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        No workflow actions taken yet.
                                    </Typography>
                                ) : (
                                    <List>
                                        {workflowParticipants.map((participant, idx) => (
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
                                                                By: {participant.action_by_name || 'Unknown'} • {formatDate(participant.action_at)}
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
                        {auditTrail.length === 0 ? (
                            <EmptyState
                                icon={HistoryIcon}
                                title="No audit entries"
                                description="Actions on this file will be logged here."
                            />
                        ) : (
                            <List>
                                {[...auditTrail].reverse().map((entry) => (
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
                                            secondary={`${entry.performed_by_name || 'Unknown'} • ${formatDate(entry.performed_at)}`}
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
                        You are about to perform "{WORKFLOW_ACTION_LABELS[actionDialog.action]}" on file {fileNumber}.
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
                    <Button onClick={() => setActionDialog({ open: false, action: null })} disabled={actionLoading}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={confirmAction} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default FileDetailPage;
