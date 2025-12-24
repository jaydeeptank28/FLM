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
    Paper,
    Stepper,
    Step,
    StepLabel
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
    const { currentDepartment, currentDepartmentId, currentUser } = useAuth();
    const { createFile, performWorkflowAction } = useFiles();
    const { showSuccess, showError } = useNotification();

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
            setWorkflowError('No department selected');
            return;
        }

        setWorkflowLoading(true);
        setWorkflowError(null);

        try {
            // Use the dedicated API method
            const response = await api.getWorkflowPreview(deptId, fileType);
            
            // Response format: { success: true, data: { success: true, workflow: {...} } }
            // or: { success: true, data: { success: false, error: '...' } }
            const previewData = response?.data || response;
            
            console.log('[FileCreatePage] Workflow preview response:', previewData);
            
            if (previewData?.success && previewData?.workflow) {
                setWorkflowPreview(previewData.workflow);
                setWorkflowError(null);
            } else if (previewData?.workflow) {
                // Direct workflow object
                setWorkflowPreview(previewData.workflow);
                setWorkflowError(null);
            } else if (previewData?.success === false) {
                // Backend returned success: false with error message
                setWorkflowError(previewData?.error || 'No workflow configured for this department');
                setWorkflowPreview(null);
            } else {
                setWorkflowError('No workflow found for this combination');
                setWorkflowPreview(null);
            }
        } catch (error) {
            console.error('[FileCreatePage] Workflow preview error:', error);
            const errMsg = error.message || 'Failed to load workflow';
            setWorkflowError(errMsg);
            setWorkflowPreview(null);
        } finally {
            setWorkflowLoading(false);
        }
    }, []);

    // Auto-fetch workflow on mount and when fileType changes
    useEffect(() => {
        // Debug logging
        console.log('[FileCreatePage] Department Context:', {
            currentDepartment,
            currentDepartmentId,
            fileType: formData.fileType
        });

        if (currentDepartmentId) {
            // Set department info from context
            setFormData(prev => ({
                ...prev,
                department: currentDepartment || '',
                departmentId: currentDepartmentId
            }));
            // Fetch workflow preview
            fetchWorkflowPreview(currentDepartmentId, formData.fileType);
        } else {
            // No department selected - show error
            setWorkflowError('No department selected. Please login again or select a department.');
            setWorkflowPreview(null);
        }
    }, [currentDepartmentId, currentDepartment, formData.fileType, fetchWorkflowPreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

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

        // Department is auto-set from context
        if (!currentDepartmentId) newErrors.department = 'You must be assigned to a department to create files';
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

        return (
            <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                {/* Workflow Name */}
                <Typography variant="subtitle1" fontWeight={700} color="success.dark" gutterBottom>
                    ✅ {workflowPreview.name}
                </Typography>
                
                {/* Approval Levels */}
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                    Approval Flow
                </Typography>

                <Stepper orientation="vertical" activeStep={-1} sx={{ mt: 2 }}>
                    <Step expanded active>
                        <StepLabel icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />}>
                            <Typography variant="body2" fontWeight={600}>File Created</Typography>
                            <Typography variant="caption" color="text.secondary">By You ({currentUser?.name})</Typography>
                        </StepLabel>
                    </Step>
                    
                    {workflowPreview.levels?.map((level, index) => (
                        <Step key={level.level} expanded active>
                            <StepLabel icon={<Typography variant="caption" sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{index + 1}</Typography>}>
                                <Typography variant="body2" fontWeight={600}>
                                    {ROLE_LABELS[level.role_required] || level.role_required}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {level.approvers && level.approvers.length > 0 
                                        ? `Approvers: ${level.approvers.map(u => u.name).join(', ')}`
                                        : `Approver: Any ${ROLE_LABELS[level.role_required] || level.role_required}`
                                    }
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}

                    <Step expanded active>
                        <StepLabel icon={<CheckIcon color="success" sx={{ fontSize: 20 }} />}>
                            <Typography variant="body2" fontWeight={600} color="success.main">Final Approval</Typography>
                            <Typography variant="caption" color="text.secondary">Workflow Complete</Typography>
                        </StepLabel>
                    </Step>
                </Stepper>

                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Total Levels: {workflowPreview.totalLevels || workflowPreview.levels?.length || 0}
                    </Typography>
                    <Chip 
                        label={workflowPreview.scopeReason === 'GLOBAL_DEFAULT' ? 'Global Default' : 'Department Standard'} 
                        size="small" 
                        color="info" 
                        variant="soft" 
                    />
                </Box>
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
                                        <strong>File Number:</strong> Will be auto-generated on save (Format: ezFLM/DEPT/YYYY/NNNN)
                                    </Alert>
                                </Grid>

                                {/* Department - READ ONLY (FLM: users create files only in their department) */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Department"
                                        value={currentDepartment ? `${currentDepartment}` : 'No department assigned'}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                        disabled={!currentDepartment}
                                    />
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
