// File Create Page - Production API Version
import React, { useState } from 'react';
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
    CircularProgress
} from '@mui/material';
import {
    Save as SaveIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Delete as DeleteIcon,
    Description as FileIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useFiles } from '../../contexts/FileContext';
import { useNotification } from '../../contexts/NotificationContext';
import { FILE_TYPES, PRIORITIES, WORKFLOW_ACTIONS } from '../../utils/constants';

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
                                        <strong>File Number:</strong> Will be auto-generated on save
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
                                        helperText={errors.fileType}
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
                                        placeholder="Enter a descriptive subject for this file"
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
                                        {priorities.map((priority) => (
                                            <MenuItem key={priority} value={priority}>
                                                {priority}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Initial Noting */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        label="Initial Noting"
                                        name="initialNoting"
                                        value={formData.initialNoting}
                                        onChange={handleChange}
                                        error={!!errors.initialNoting}
                                        helperText={errors.initialNoting || 'Add initial notes or remarks for this file'}
                                        placeholder="Enter initial noting content..."
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} lg={4}>
                    {/* Documents */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Documents
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    component="span"
                                    startIcon={<AttachFileIcon />}
                                    sx={{ mb: 2 }}
                                >
                                    Attach Documents
                                </Button>
                            </label>

                            {documents.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No documents attached
                                </Typography>
                            ) : (
                                <List dense>
                                    {documents.map((doc) => (
                                        <ListItem key={doc.id}>
                                            <ListItemIcon>
                                                <FileIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={doc.name}
                                                secondary={`${(doc.size / 1024).toFixed(1)} KB`}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={() => handleRemoveDocument(doc.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Actions
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                    onClick={handleSaveDraft}
                                    disabled={loading}
                                >
                                    Save as Draft
                                </Button>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    Submit for Approval
                                </Button>
                            </Box>

                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                * Submitting will send the file for first level approval
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default FileCreatePage;
