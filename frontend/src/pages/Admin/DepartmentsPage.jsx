// Department Management Page
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
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

function DepartmentsPage() {
    const { showSuccess, showError } = useNotification();
    
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        setLoading(true);
        try {
            const data = await api.getDepartments();
            setDepartments(data || []);
        } catch (error) {
            console.error('Error loading departments:', error);
            showError('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (dept = null) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                code: dept.code,
                description: dept.description || ''
            });
        } else {
            setEditingDept(null);
            setFormData({
                name: '',
                code: '',
                description: ''
            });
        }
        setErrors({});
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingDept(null);
        setFormData({
            name: '',
            code: '',
            description: ''
        });
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
        if (!formData.code.trim()) newErrors.code = 'Code is required';
        if (formData.code.length > 10) newErrors.code = 'Code must be 10 characters or less';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            if (editingDept) {
                await api.updateDepartment(editingDept.id, formData);
                showSuccess('Department updated successfully');
            } else {
                await api.createDepartment(formData);
                showSuccess('Department created successfully');
            }
            handleCloseDialog();
            loadDepartments();
        } catch (error) {
            showError(error.message || 'Failed to save department');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (deptId) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        
        try {
            await api.deleteDepartment(deptId);
            showSuccess('Department deleted successfully');
            loadDepartments();
        } catch (error) {
            showError(error.message || 'Failed to delete department');
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
                        <BusinessIcon sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Department Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage organizational departments
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Department
                </Button>
            </Box>

            {/* Departments Table */}
            <Card>
                <CardContent>
                    {departments.length === 0 ? (
                        <Alert severity="info">No departments found. Create your first department.</Alert>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Code</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departments.map((dept) => (
                                        <TableRow key={dept.id}>
                                            <TableCell>
                                                <Chip label={dept.code} size="small" color="primary" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={500}>{dept.name}</Typography>
                                            </TableCell>
                                            <TableCell>{dept.description || '-'}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={dept.is_active ? 'Active' : 'Inactive'} 
                                                    size="small" 
                                                    color={dept.is_active ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleOpenDialog(dept)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDelete(dept.id)}
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

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingDept ? 'Edit Department' : 'Add New Department'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Department Code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            error={!!errors.code}
                            helperText={errors.code || 'Short code (e.g., FIN, HR, ADMIN)'}
                            inputProps={{ maxLength: 10 }}
                        />
                        <TextField
                            fullWidth
                            label="Department Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            multiline
                            rows={3}
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

export default DepartmentsPage;
