// Workflow Management Page - Improved UX
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AccountTree as WorkflowIcon,
    Visibility as ViewIcon,
    ArrowForward as ArrowIcon,
    CheckCircle as CheckIcon,
    RemoveCircle as RemoveIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

function WorkflowsPage() {
    const { showSuccess, showError } = useNotification();
    
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isDefault: false,
        levels: []
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Available roles for dropdown
    const availableRoles = [
        { value: 'Section Officer', label: 'Section Officer' },
        { value: 'Under Secretary', label: 'Under Secretary' },
        { value: 'Deputy Secretary', label: 'Deputy Secretary' },
        { value: 'Joint Secretary', label: 'Joint Secretary' },
        { value: 'Additional Secretary', label: 'Additional Secretary' },
        { value: 'Secretary', label: 'Secretary' }
    ];

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        setLoading(true);
        try {
            const data = await api.getWorkflowTemplates();
            setWorkflows(data || []);
        } catch (error) {
            console.error('Error loading workflows:', error);
            showError('Failed to load workflows');
        } finally {
            setLoading(false);
        }
    };

    const handleViewWorkflow = async (workflow) => {
        try {
            const details = await api.getWorkflowTemplate(workflow.id);
            setSelectedWorkflow(details);
            setViewDialogOpen(true);
        } catch (error) {
            showError('Failed to load workflow details');
        }
    };

    const handleOpenDialog = (workflow = null) => {
        if (workflow) {
            setEditingWorkflow(workflow);
            // Convert existing levels to format for editing
            const levels = workflow.levels?.map(l => ({
                role: l.role_required || l.role,
                description: l.description || ''
            })) || [];
            
            setFormData({
                name: workflow.name,
                description: workflow.description || '',
                isDefault: workflow.is_default || false,
                levels: levels.length > 0 ? levels : [{ role: '', description: '' }]
            });
        } else {
            setEditingWorkflow(null);
            setFormData({
                name: '',
                description: '',
                isDefault: false,
                levels: [{ role: '', description: '' }]
            });
        }
        setErrors({});
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingWorkflow(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle level changes
    const handleLevelChange = (index, field, value) => {
        setFormData(prev => {
            const newLevels = [...prev.levels];
            newLevels[index] = { ...newLevels[index], [field]: value };
            return { ...prev, levels: newLevels };
        });
    };

    // Add new level
    const addLevel = () => {
        setFormData(prev => ({
            ...prev,
            levels: [...prev.levels, { role: 'Under Secretary', description: '' }]
        }));
    };

    // Remove level
    const removeLevel = (index) => {
        if (formData.levels.length <= 1) {
            showError('Workflow must have at least 1 level');
            return;
        }
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.filter((_, i) => i !== index)
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Workflow name is required';
        if (formData.levels.length === 0) newErrors.levels = 'At least one level is required';
        
        // Check if all levels have roles
        const hasEmptyRoles = formData.levels.some(l => !l.role);
        if (hasEmptyRoles) newErrors.levels = 'All levels must have a role selected';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const levels = formData.levels.map((level, index) => ({
                levelOrder: index + 1,
                level: index + 1,
                roleRequired: level.role,
                role: level.role,
                description: level.description || `Level ${index + 1} approval`
            }));

            const payload = {
                name: formData.name,
                description: formData.description,
                maxLevels: levels.length,
                isDefault: formData.isDefault,
                levels
            };

            if (editingWorkflow) {
                await api.updateWorkflowTemplate(editingWorkflow.id, payload);
                showSuccess('Workflow updated successfully');
            } else {
                await api.createWorkflowTemplate(payload);
                showSuccess('Workflow created successfully');
            }
            handleCloseDialog();
            loadWorkflows();
        } catch (error) {
            showError(error.message || 'Failed to save workflow');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (workflowId) => {
        if (!window.confirm('Are you sure you want to delete this workflow?')) return;
        
        try {
            await api.deleteWorkflowTemplate(workflowId);
            showSuccess('Workflow deleted successfully');
            loadWorkflows();
        } catch (error) {
            showError(error.message || 'Failed to delete workflow');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

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
                        <WorkflowIcon sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Workflow Templates
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Define approval levels for file processing
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    size="large"
                >
                    Create New Workflow
                </Button>
            </Box>

            {/* Info Box */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>What is a Workflow Template?</strong> When you create a file, it goes through each level for approval. 
                    Here you can define how many levels a file needs to be approved and which role will approve at each level.
                </Typography>
            </Alert>

            {/* Workflows Cards */}
            {workflows.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <WorkflowIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            No Workflow Templates Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Create your first workflow template to define how files get approved.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Create First Workflow
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                    {workflows.map((workflow) => (
                        <Card key={workflow.id} sx={{ position: 'relative' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600}>
                                            {workflow.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {workflow.description || 'No description'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        {workflow.is_default && (
                                            <Chip label="Default" size="small" color="primary" sx={{ mr: 1 }} />
                                        )}
                                        <Chip 
                                            label={`${workflow.max_levels || workflow.level_count || workflow.levels?.length || 0} Levels`} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>

                                {/* Visual Level Flow */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    mb: 2,
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1
                                }}>
                                    <Chip label="File Created" size="small" color="default" />
                                    {(workflow.levels || []).map((level, index) => (
                                        <React.Fragment key={index}>
                                            <ArrowIcon color="action" fontSize="small" />
                                            <Chip 
                                                label={`L${level.level || index + 1}: ${level.role || level.role_required}`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </React.Fragment>
                                    ))}
                                    {(!workflow.levels || workflow.levels.length === 0) && (
                                        <>
                                            <ArrowIcon color="action" fontSize="small" />
                                            <Chip label={`${workflow.max_levels || 3} approval levels`} size="small" color="primary" variant="outlined" />
                                        </>
                                    )}
                                    <ArrowIcon color="action" fontSize="small" />
                                    <Chip label="✓ Approved" size="small" color="success" />
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button 
                                        size="small" 
                                        startIcon={<ViewIcon />}
                                        onClick={() => handleViewWorkflow(workflow)}
                                    >
                                        View
                                    </Button>
                                    <Button 
                                        size="small" 
                                        startIcon={<EditIcon />}
                                        onClick={() => handleOpenDialog(workflow)}
                                    >
                                        Edit
                                    </Button>
                                    <Button 
                                        size="small" 
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleDelete(workflow.id)}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* View Workflow Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkflowIcon color="primary" />
                        <Typography variant="h6">{selectedWorkflow?.name}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedWorkflow && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {selectedWorkflow.description || 'No description provided'}
                            </Typography>
                            
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                                Approval Flow:
                            </Typography>
                            
                            <Stepper orientation="vertical" activeStep={-1}>
                                <Step completed>
                                    <StepLabel>
                                        <Typography fontWeight={500}>File Created</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Clerk/User creates the file
                                        </Typography>
                                    </StepLabel>
                                </Step>
                                {selectedWorkflow.levels?.map((level, index) => (
                                    <Step key={level.id || index} completed>
                                        <StepLabel>
                                            <Typography fontWeight={500}>
                                                Level {level.level || level.level_order || index + 1}: {level.role || level.role_required}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {level.description || 'Approval required at this level'}
                                            </Typography>
                                        </StepLabel>
                                    </Step>
                                ))}
                                <Step completed>
                                    <StepLabel icon={<CheckIcon color="success" />}>
                                        <Typography fontWeight={500} color="success.main">File Approved ✓</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            All levels completed
                                        </Typography>
                                    </StepLabel>
                                </Step>
                            </Stepper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                    <Button 
                        variant="contained"
                        onClick={() => {
                            setViewDialogOpen(false);
                            handleOpenDialog(selectedWorkflow);
                        }}
                    >
                        Edit Workflow
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Dialog - Improved */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkflowIcon color="primary" />
                        <Typography variant="h6">
                            {editingWorkflow ? 'Edit Workflow Template' : 'Create New Workflow Template'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        {/* Basic Info */}
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Step 1: Basic Information
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 4 }}>
                            <TextField
                                fullWidth
                                label="Workflow Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name || 'Example: Three Level Approval'}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Description (Optional)"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                helperText="Brief description of this workflow"
                            />
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Levels Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Step 2: Define Approval Levels
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    File will go through each level in order. Add levels from top to bottom.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={addLevel}
                            >
                                Add Level
                            </Button>
                        </Box>

                        {errors.levels && (
                            <Alert severity="error" sx={{ mb: 2 }}>{errors.levels}</Alert>
                        )}

                        {/* Visual Level Builder */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Chip label="File Created by User" size="small" color="default" />
                                <ArrowIcon color="action" fontSize="small" />
                            </Box>

                            {formData.levels.map((level, index) => (
                                <Box 
                                    key={index} 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 2, 
                                        mb: 2,
                                        p: 2,
                                        bgcolor: 'white',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Chip 
                                        label={`Level ${index + 1}`} 
                                        color="primary" 
                                        size="small"
                                        sx={{ minWidth: 70 }}
                                    />
                                    
                                    <TextField
                                        select
                                        size="small"
                                        label="Approver Role"
                                        value={level.role}
                                        onChange={(e) => handleLevelChange(index, 'role', e.target.value)}
                                        sx={{ minWidth: 220 }}
                                        required
                                    >
                                        {availableRoles.map((role) => (
                                            <MenuItem key={role.value} value={role.value}>
                                                {role.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <TextField
                                        size="small"
                                        label="Description (Optional)"
                                        value={level.description}
                                        onChange={(e) => handleLevelChange(index, 'description', e.target.value)}
                                        sx={{ flex: 1 }}
                                        placeholder="e.g., Budget review"
                                    />

                                    <IconButton 
                                        color="error" 
                                        onClick={() => removeLevel(index)}
                                        disabled={formData.levels.length <= 1}
                                        title="Remove this level"
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                </Box>
                            ))}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, ml: 1 }}>
                                <ArrowIcon color="action" fontSize="small" />
                                <Chip icon={<CheckIcon />} label="File Approved ✓" size="small" color="success" />
                            </Box>
                        </Paper>

                        {/* Preview */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Preview: How file will flow
                            </Typography>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                flexWrap: 'wrap',
                                p: 2,
                                bgcolor: 'primary.50',
                                borderRadius: 1
                            }}>
                                <Chip label="Create" size="small" />
                                {formData.levels.map((level, index) => (
                                    <React.Fragment key={index}>
                                        <ArrowIcon fontSize="small" />
                                        <Chip 
                                            label={`L${index + 1}: ${level.role}`} 
                                            size="small" 
                                            color="primary"
                                        />
                                    </React.Fragment>
                                ))}
                                <ArrowIcon fontSize="small" />
                                <Chip label="✓ Done" size="small" color="success" />
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSave}
                        disabled={saving}
                        size="large"
                    >
                        {saving ? <CircularProgress size={20} /> : (editingWorkflow ? 'Update Workflow' : 'Create Workflow')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default WorkflowsPage;
