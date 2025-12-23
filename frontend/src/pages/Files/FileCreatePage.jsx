// File Create Page - FLM Production with Workflow Preview
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    MenuItem,
    Grid,
    Divider,
    Alert,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
    Chip,
    Paper
} from '@mui/material';
import {
    Save as SaveIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Delete as DeleteIcon,
    Description as FileIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckIcon,
    SkipNext as SkipIcon,
    RadioButtonUnchecked as PendingIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useFiles } from '../../contexts/FileContext';
import { useNotification } from '../../contexts/NotificationContext';
import { FILE_TYPES, PRIORITIES, WORKFLOW_ACTIONS, ROLE_LABELS } from '../../utils/constants';
import api from '../../services/api';

function FileCreatePage() {
    const navigate = useNavigate();
    const { currentDepartment, currentDepartmentId, getAllDepartments } = useAuth();
    const { createFile, performWorkflowAction } = useFiles();
    const { showSuccess, showError } = useNotification();

    const departments = getAllDepartments();
    const fileTypes = Object.values(FILE_TYPES);
    const priorities = Object.values(PRIORITIES);

    const [formData, setFormData] = useState({
        department: currentDepartment || '',
        departmentId: currentDepartmentId || '',
        fileType: '',
        subject: '',
        priority: 'Medium',
        initialNoting: ''
    });

    const [documents, setDocuments] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Workflow preview state
    const [workflowPreview, setWorkflowPreview] = useState(null);
    const [workflowLoading, setWorkflowLoading] = useState(false);
    const [workflowError, setWorkflowError] = useState(null);

    // Fetch workflow preview when department/fileType changes
    const fetchWorkflowPreview = useCallback(async (deptId, fileType) => {
        if (!deptId) {
            setWorkflowPreview(null);
            return;
        }

        setWorkflowLoading(true);
        setWorkflowError(null);

        try {
            const params = new URLSearchParams({ departmentId: deptId });
            if (fileType) params.append('fileType', fileType);
            
            const response = await api.get(`/files/workflow-preview?${params}`);
            
            if (response.data.success && response.data.data.success) {
                setWorkflowPreview(response.data.data.workflow);
            } else {
                setWorkflowError(response.data.data.error || 'No workflow found');
                setWorkflowPreview(null);
            }
        } catch (error) {
            setWorkflowError(error.response?.data?.message || 'Failed to load workflow');
            setWorkflowPreview(null);
        } finally {
            setWorkflowLoading(false);
        }
    }, []);

    // Fetch workflow when department or file type changes
    useEffect(() => {
        if (formData.departmentId) {
            fetchWorkflowPreview(formData.departmentId, formData.fileType);
        }
    }, [formData.departmentId, formData.fileType, fetchWorkflowPreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If department changed, update departmentId
        if (name === 'department') {
            const dept = departments.find(d => d.code === value);
            if (dept) {
                setFormData(prev => ({ ...prev, department: value, departmentId: dept.id }));
            }
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newDocs = files.map(file => ({
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            type: 'NORMAL'
        }));
        setDocuments(prev => [...prev, ...newDocs]);
    };

    const handleRemoveDocument = (docId) => {
        setDocuments(prev => prev.filter(d => d.id !== docId));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.fileType) newErrors.fileType = 'File type is required';
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
        if (formData.subject.length > 200) newErrors.subject = 'Subject must be less than 200 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveDraft = async () => {
        if (!validate()) return;

        // Check workflow exists
        if (!workflowPreview && !workflowLoading) {
            showError('Cannot create file: No workflow configured for this department');
            return;
        }

        setLoading(true);
        try {
            const result = await createFile({
                subject: formData.subject,
                fileType: formData.fileType,
                priority: formData.priority,
                initialNoting: formData.initialNoting
            });

            if (result.success) {
                showSuccess('File saved as draft successfully');
                navigate(`/files/view/${result.file.id}`);
            } else {
                showError(result.error || 'Failed to save file');
            }
        } catch (error) {
            showError('Failed to save file');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        // Check workflow exists
        if (!workflowPreview && !workflowLoading) {
            showError('Cannot submit: No workflow configured for this department');
            return;
        }

        if (!formData.initialNoting.trim()) {
            setErrors(prev => ({ ...prev, initialNoting: 'Initial noting is required before submission' }));
            return;
        }

        setLoading(true);
        try {
            const result = await createFile({
                subject: formData.subject,
                fileType: formData.fileType,
                priority: formData.priority,
                initialNoting: formData.initialNoting
            });

            if (result.success) {
                // Submit the file
                const submitResult = await performWorkflowAction(result.file.id, WORKFLOW_ACTIONS.SUBMIT);

                if (submitResult.success) {
                    showSuccess('File created and submitted successfully');
                    navigate(`/files/view/${result.file.id}`);
                } else {
                    showError(submitResult.error || 'File saved but submission failed');
                    navigate(`/files/view/${result.file.id}`);
                }
            } else {
                showError(result.error || 'Failed to create file');
            }
        } catch (error) {
            showError('Failed to create file');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Render workflow preview panel
    const renderWorkflowPreview = () => {
        if (workflowLoading) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                        Loading workflow...
                    </Typography>
                </Box>
            );
        }

        if (workflowError) {
            return (
                <Alert severity="error" icon={<WarningIcon />}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        ⚠️ No Workflow Available
                    </Typography>
                    <Typography variant="body2">
                        {workflowError}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Please contact Admin to create a workflow for this department.
                    </Typography>
                </Alert>
            );
        }

        if (!workflowPreview) {
            return (
                <Alert severity="info">
                    <Typography variant="body2">
                        Select a department and file type to preview the approval workflow.
                    </Typography>
                </Alert>
            );
        }

        const skippedCount = workflowPreview.levels?.filter(l => l.willSkip).length || 0;

        return (
            <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <Typography variant="subtitle2" fontWeight={700} color="success.dark" gutterBottom>
                    ✅ Workflow: {workflowPreview.name}
                </Typography>
                
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    {workflowPreview.selectionReason}
                </Typography>

                {skippedCount > 0 && (
                    <Alert severity="info" sx={{ my: 1, py: 0.5 }}>
                        <Typography variant="caption">
                            <strong>Skip Logic Active:</strong> {skippedCount} level(s) will be skipped because your role ({ROLE_LABELS[workflowPreview.creatorRole] || workflowPreview.creatorRole}) has equal/higher authority.
                        </Typography>
                    </Alert>
                )}

                <Divider sx={{ my: 1.5 }} />
                
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                    APPROVAL LEVELS:
                </Typography>

                <Box sx={{ mt: 1 }}>
                    {workflowPreview.levels?.map((level, index) => (
                        <Box 
                            key={level.level} 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                py: 0.5,
                                opacity: level.willSkip ? 0.6 : 1
                            }}
                        >
                            {level.willSkip ? (
                                <SkipIcon fontSize="small" color="info" />
                            ) : level.level === workflowPreview.firstActiveLevel ? (
                                <CheckIcon fontSize="small" color="warning" />
                            ) : (
                                <PendingIcon fontSize="small" color="disabled" />
                            )}
                            
                            <Typography variant="body2" sx={{ textDecoration: level.willSkip ? 'line-through' : 'none' }}>
                                L{level.level}: {ROLE_LABELS[level.role_required] || level.role_required}
                            </Typography>

                            {level.willSkip && (
                                <Chip label="SKIP" size="small" color="info" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                            {level.level === workflowPreview.firstActiveLevel && !level.willSkip && (
                                <Chip label="START" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ my: 1.5 }} />
                
                <Typography variant="caption" color="text.secondary">
                    After all levels → APPROVED → Archive (read-only)
                </Typography>
            </Paper>
        );
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Create New File
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Fill in the details to create a new file
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Main Form */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                File Information
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
                                {/* File Number Preview */}
                                <Grid item xs={12}>
                                    <Alert severity="info" icon={<FileIcon />}>
                                        <strong>File Number:</strong> Will be auto-generated on save (Format: FLM/DEPT/YYYY/NNNN)
                                    </Alert>
                                </Grid>

                                {/* Department */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Department *"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        error={!!errors.department}
                                        helperText={errors.department}
                                    >
                                        {departments.map((dept) => (
                                            <MenuItem key={dept.id} value={dept.code}>
                                                {dept.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* File Type */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="File Type *"
                                        name="fileType"
                                        value={formData.fileType}
                                        onChange={handleChange}
                                        error={!!errors.fileType}
                                        helperText={errors.fileType || "Affects workflow selection"}
                                    >
                                        {fileTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Subject */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Subject *"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        error={!!errors.subject}
                                        helperText={errors.subject || `${formData.subject.length}/200 characters`}
                                        inputProps={{ maxLength: 200 }}
                                    />
                                </Grid>

                                {/* Priority */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                    >
                                        {priorities.map((p) => (
                                            <MenuItem key={p} value={p}>
                                                {p}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Initial Noting */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Initial Noting
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        placeholder="Enter initial noting for this file... (Required for submission)"
                                        name="initialNoting"
                                        value={formData.initialNoting}
                                        onChange={handleChange}
                                        error={!!errors.initialNoting}
                                        helperText={errors.initialNoting}
                                    />
                                </Grid>

                                {/* Documents */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Attachments
                                    </Typography>
                                    <Box sx={{
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        p: 2,
                                        textAlign: 'center'
                                    }}>
                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            id="file-upload"
                                            onChange={handleFileUpload}
                                        />
                                        <label htmlFor="file-upload">
                                            <Button
                                                component="span"
                                                variant="outlined"
                                                startIcon={<AttachFileIcon />}
                                            >
                                                Add Documents
                                            </Button>
                                        </label>
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                            Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB each)
                                        </Typography>
                                    </Box>

                                    {documents.length > 0 && (
                                        <List dense sx={{ mt: 2 }}>
                                            {documents.map((doc) => (
                                                <ListItem key={doc.id}>
                                                    <ListItemIcon>
                                                        <FileIcon />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={doc.name}
                                                        secondary={`${(doc.size / 1024).toFixed(2)} KB`}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => handleRemoveDocument(doc.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar - Workflow Preview */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ position: 'sticky', top: 20 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                🔄 Workflow Preview
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            {renderWorkflowPreview()}

                            <Divider sx={{ my: 2 }} />

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="large"
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                    onClick={handleSaveDraft}
                                    disabled={loading || workflowError}
                                >
                                    Save as Draft
                                </Button>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    color="primary"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    onClick={handleSubmit}
                                    disabled={loading || workflowError}
                                >
                                    Submit for Approval
                                </Button>
                            </Box>

                            {workflowError && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    Cannot submit without a valid workflow.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default FileCreatePage;
