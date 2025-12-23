// Workflow Management Page
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
    Chip,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AccountTree as WorkflowIcon,
    Visibility as ViewIcon
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
        fileType: '',
        levels: ''
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

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
            setFormData({
                name: workflow.name,
                description: workflow.description || '',
                fileType: workflow.file_type || '',
                levels: workflow.levels?.map(l => l.role_required).join(', ') || ''
            });
        } else {
            setEditingWorkflow(null);
            setFormData({
                name: '',
                description: '',
                fileType: '',
                levels: 'Clerk, Section Officer, Under Secretary'
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

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.fileType.trim()) newErrors.fileType = 'File type is required';
        if (!formData.levels.trim()) newErrors.levels = 'At least one level is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const levels = formData.levels.split(',').map((role, index) => ({
                levelOrder: index + 1,
                roleRequired: role.trim()
            }));

            if (editingWorkflow) {
                await api.updateWorkflowTemplate(editingWorkflow.id, {
                    name: formData.name,
                    description: formData.description,
                    fileType: formData.fileType,
                    levels
                });
                showSuccess('Workflow updated successfully');
            } else {
                await api.createWorkflowTemplate({
                    name: formData.name,
                    description: formData.description,
                    fileType: formData.fileType,
                    levels
                });
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
                            Manage file approval workflows
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Workflow
                </Button>
            </Box>

            {/* Workflows Table */}
            <Card>
                <CardContent>
                    {workflows.length === 0 ? (
                        <Alert severity="info">No workflows found. Create your first workflow template.</Alert>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>File Type</TableCell>
                                        <TableCell>Levels</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {workflows.map((workflow) => (
                                        <TableRow key={workflow.id}>
                                            <TableCell>
                                                <Typography fontWeight={500}>{workflow.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {workflow.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={workflow.file_type || 'Any'} size="small" />
                                            </TableCell>
                                            <TableCell>
                                                {workflow.level_count || workflow.levels?.length || 0} levels
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={workflow.is_active ? 'Active' : 'Inactive'} 
                                                    size="small" 
                                                    color={workflow.is_active !== false ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleViewWorkflow(workflow)}
                                                    title="View Details"
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleOpenDialog(workflow)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDelete(workflow.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* View Workflow Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Workflow Details: {selectedWorkflow?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedWorkflow && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {selectedWorkflow.description}
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                Approval Levels:
                            </Typography>
                            <List dense>
                                {selectedWorkflow.levels?.map((level, index) => (
                                    <ListItem key={level.id || index}>
                                        <ListItemText
                                            primary={`Level ${level.level_order}: ${level.role_required}`}
                                            secondary={level.description || 'Approval required'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingWorkflow ? 'Edit Workflow' : 'Add New Workflow'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Workflow Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            fullWidth
                            label="File Type"
                            name="fileType"
                            value={formData.fileType}
                            onChange={handleChange}
                            error={!!errors.fileType}
                            helperText={errors.fileType || 'e.g., General, Policy, Budget'}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            multiline
                            rows={2}
                        />
                        <TextField
                            fullWidth
                            label="Approval Levels"
                            name="levels"
                            value={formData.levels}
                            onChange={handleChange}
                            error={!!errors.levels}
                            helperText={errors.levels || 'Comma-separated roles (e.g., Clerk, Section Officer, Under Secretary)'}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={20} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default WorkflowsPage;
