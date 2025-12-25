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
    Divider,
    Grid,
    Avatar,
    Tooltip,
    CardActions,
    Menu,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AccountTree as WorkflowIcon,
    Visibility as ViewIcon,
    ArrowForward as ArrowIcon,
    CheckCircle as CheckIcon,
    RemoveCircle as RemoveIcon,
    Star as StarIcon,
    FilterList as FilterListIcon
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
        departmentId: '',
        fileType: '',
        levels: []
    });
    const [departments, setDepartments] = useState([]);
    const [filterDepartmentId, setFilterDepartmentId] = useState(''); // Default to All Departments
    const [anchorEl, setAnchorEl] = useState(null);
    const openFilterMenu = Boolean(anchorEl);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Available roles for dropdown - FLM Standard (values match database)
    const availableRoles = [
        { value: 'Clerk', label: 'L1: Clerk', authority: 1 },
        { value: 'Section_Officer', label: 'L2: Section Officer', authority: 2 },
        { value: 'Under_Secretary', label: 'L3: Under Secretary', authority: 3 },
        { value: 'Deputy_Secretary', label: 'L4: Deputy Secretary', authority: 4 },
        { value: 'Joint_Secretary', label: 'L5: Joint Secretary', authority: 5 },
        { value: 'Additional_Secretary', label: 'L6: Additional Secretary', authority: 6 },
        { value: 'Secretary', label: 'L7: Secretary', authority: 7 }
    ];

    // File types for dropdown
    const fileTypes = ['Budget', 'Policy', 'Correspondence', 'Proposal', 'Report', 'Contract', 'Memo', 'Circular', 'General'];

    const formatRoleName = (role) => {
        try {
            if (!role) return '';
            const found = availableRoles.find(r => r.value === role);
            if (found) return found.label.split(': ')[1]; // Return "Section Officer" instead of "L2: Section Officer" for cleaner UI
            return role; // Roles now stored with spaces, no need to replace underscores
        } catch (e) {
            console.error('Role format error:', e);
            return role || '';
        }
    };

    useEffect(() => {
        loadWorkflows();
        loadDepartments();
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

    const loadDepartments = async () => {
        try {
            const data = await api.getDepartments();
            setDepartments(data || []);
        } catch (error) {
            console.error('Error loading departments:', error);
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
                departmentId: workflow.department_id || '',
                fileType: workflow.file_type || '',
                levels: levels.length > 0 ? levels : [{ role: '', description: '' }]
            });
        } else {
            setEditingWorkflow(null);
            setFormData({
                name: '',
                description: '',
                // Pre-fill department from filter if selected
                departmentId: filterDepartmentId || '', 
                fileType: '',
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
                departmentId: formData.departmentId || null,
                fileType: formData.fileType || null,
                maxLevels: levels.length,
                // NOTE: isDefault is NOT sent - backend derives it automatically from scope
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
            // Extract detailed error message from API response
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save workflow';
            showError(errorMsg);
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

    // Filter and Sort Workflows
    const filteredWorkflows = workflows.filter(w => {
        if (!filterDepartmentId) return true; 
        // Strict Filter: Global workflows (null dept) are HIDDEN if a specific dept is selected
        return w.department_id === filterDepartmentId;
    }).sort((a, b) => {
        // Sort System/Global first
        const isASystem = !a.department_id && !a.file_type;
        const isBSystem = !b.department_id && !b.file_type;
        if (isASystem && !isBSystem) return -1;
        if (!isASystem && isBSystem) return 1;
        return a.name.localeCompare(b.name);
    });

    // Group workflows by department for display
    const groupedWorkflows = filteredWorkflows.reduce((acc, workflow) => {
        let groupName = 'Unknown';
        if (!workflow.department_id) {
            groupName = 'Global / System Wide';
        } else {
            groupName = workflow.department_name || departments.find(d => d.id === workflow.department_id)?.name || 'Unknown Department';
        }
        
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(workflow);
        return acc;
    }, {});

    const sortedGroups = Object.keys(groupedWorkflows).sort((a, b) => {
        if (a.includes('Global')) return -1;
        if (b.includes('Global')) return 1;
        return a.localeCompare(b);
    }).map(name => ({ name, workflows: groupedWorkflows[name] }));

    const renderWorkflowCard = (workflow) => {
        const isGlobalDefault = !workflow.department_id && !workflow.file_type && workflow.is_default;
        const isSystemWorkflow = !workflow.department_id && !workflow.file_type;
        const isDeptDefault = workflow.department_id && !workflow.file_type;

        let badgeColor = 'default';
        let badgeLabel = 'Custom Workflow';
        let badgeIcon = undefined;

        if (isSystemWorkflow) {
            badgeColor = 'secondary';
            badgeLabel = 'Global Default';
            badgeIcon = <StarIcon sx={{ fontSize: '1rem !important' }} />;
        } else if (isDeptDefault) {
            badgeColor = 'primary';
            badgeLabel = `${workflow.department_name} Default`;
        } else {
            badgeColor = 'success';
            badgeLabel = `${workflow.department_name} - ${workflow.file_type}`;
        }

        return (
            <Grid item xs={12} md={6} lg={4} key={workflow.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Chip 
                                label={badgeLabel} 
                                size="small" 
                                color={badgeColor}
                                icon={badgeIcon}
                                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
                            />
                            <Chip 
                                label={workflow.is_active !== false ? "Active" : "Inactive"} 
                                size="small" 
                                color={workflow.is_active !== false ? "success" : "default"}
                                variant="outlined"
                                sx={{ height: 24, fontSize: '0.7rem' }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mr: 2 }}>
                                <WorkflowIcon />
                            </Avatar>
                            <Typography variant="h6" component="div" noWrap sx={{ maxWidth: 200, fontWeight: 600 }}>
                                {workflow.name}
                            </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {workflow.description || 'No description provided.'}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, minHeight: 24 }}>
                            {workflow.department_name && (
                                <Chip label={workflow.department_name} size="small" variant="outlined" color="primary" />
                            )}
                            
                            {workflow.file_type && (
                                <Chip label={workflow.file_type} size="small" variant="outlined" color="info" />
                            )}
                            
                            {isSystemWorkflow && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    Applies to all files & departments
                                </Typography>
                            )}
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block">
                            <strong>{workflow.max_levels || workflow.levels?.length || 0}</strong> Approval Levels
                        </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
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
                        
                        {!isSystemWorkflow && (
                            <Button 
                                size="small" 
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDelete(workflow.id)}
                            >
                                Delete
                            </Button>
                        )}
                    </CardActions>
                </Card>
            </Grid>
        );
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ minWidth: 200, justifyContent: 'space-between', bgcolor: 'background.paper' }}
                        endIcon={<ArrowIcon sx={{ transform: 'rotate(90deg)' }} />}
                    >
                        {filterDepartmentId 
                            ? (departments.find(d => d.id === filterDepartmentId)?.name || 'Unknown Dept')
                            : 'All Departments'}
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={openFilterMenu}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { minWidth: 200 } }}
                    >
                        <MenuItem onClick={() => { setFilterDepartmentId(''); setAnchorEl(null); }}>
                            <em>All Departments</em>
                        </MenuItem>
                        {departments.map((dept) => (
                            <MenuItem key={dept.id} onClick={() => { setFilterDepartmentId(dept.id); setAnchorEl(null); }}>
                                {dept.name}
                            </MenuItem>
                        ))}
                    </Menu>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        size="large"
                    >
                        Create New Workflow
                    </Button>
                </Box>
            </Box>

            {/* Workflows Cards */}
            {/* Workflows Grid */}
            {filteredWorkflows.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <WorkflowIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            No Workflows Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {filterDepartmentId ? 'No workflows found for this department.' : 'Create your first workflow template to define how files get approved.'}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Create Workflow
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Box>
                    {sortedGroups.map(group => (
                        <Box key={group.name} sx={{ mb: 5 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600, borderBottom: '2px solid', borderColor: 'primary.light', pb: 1, display: 'inline-block' }}>
                                {group.name}
                            </Typography>
                            <Grid container spacing={3}>
                                {group.workflows.map(workflow => renderWorkflowCard(workflow))}
                            </Grid>
                        </Box>
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
                                                Level {level.level || level.level_order || index + 1}: {formatRoleName(level.role || level.role_required)}
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
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 3 }}>
                            <TextField
                                fullWidth
                                label="Workflow Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name || 'Example: Finance 3-Level Approval'}
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

                        {/* Scope Section */}
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Step 2: Workflow Scope
                        </Typography>
                        
                        {editingWorkflow && !editingWorkflow.department_id && !editingWorkflow.file_type ? (
                            // Global Workflow - Locked Scope
                            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'secondary.soft', borderColor: 'secondary.main' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StarIcon color="secondary" />
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="secondary.main">
                                            Global Default Scope
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            This workflow applies to all files in all departments that don't have a specific workflow.
                                            Scope is locked for system stability.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        ) : (
                            // Standard Scope Selection
                            <React.Fragment>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="caption">
                                        <strong>Selection Priority:</strong> Specific (Dept+Type) → Dept Default → Global Default
                                    </Typography>
                                </Alert>
                                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 2 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Department"
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={handleChange}
                                        helperText="Select department (Required)"
                                        required
                                        error={!!errors.departmentId}
                                    >
                                        {departments.map((dept) => (
                                            <MenuItem key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        select
                                        fullWidth
                                        label="File Type (Optional)"
                                        name="fileType"
                                        value={formData.fileType}
                                        onChange={handleChange}
                                        helperText="Leave empty for Department Default"
                                    >
                                        <MenuItem value="">
                                            <em>All File Types (Department Default)</em>
                                        </MenuItem>
                                        {fileTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </React.Fragment>
                        )}

                        <Divider sx={{ my: 3 }} />

                        {/* Levels Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Step 3: Define Approval Levels
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
                                            label={`L${index + 1}: ${formatRoleName(level.role)}`} 
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
