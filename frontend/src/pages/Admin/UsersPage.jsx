// User Management Page
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
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

function UsersPage() {
    const { showSuccess, showError } = useNotification();
    const { getAllDepartments } = useAuth();
    
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        departmentId: '',
        role: 'Clerk'
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const roles = [
        { value: 'Clerk', label: 'Clerk' },
        { value: 'Section_Officer', label: 'Section Officer' },
        { value: 'Under_Secretary', label: 'Under Secretary' },
        { value: 'Deputy_Secretary', label: 'Deputy Secretary' },
        { value: 'Joint_Secretary', label: 'Joint Secretary' },
        { value: 'Additional_Secretary', label: 'Additional Secretary' },
        { value: 'Secretary', label: 'Secretary' }
    ];

    // Filter out admin users for display
    const displayUsers = users.filter(user => {
        const isAdmin = user.departmentRoles?.some(r => r.role === 'Admin');
        return !isAdmin;
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, deptsData] = await Promise.all([
                api.getUsers(),
                api.getDepartments()
            ]);
            setUsers(usersData || []);
            setDepartments(deptsData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            showError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get user's department name from departmentRoles array
    const getUserDepartment = (user) => {
        if (user.departmentRoles && user.departmentRoles.length > 0) {
            return user.departmentRoles[0].departmentName || user.departmentRoles[0].departmentCode || '-';
        }
        return user.department_name || '-';
    };

    // Helper to get user's role from departmentRoles array
    const getUserRole = (user) => {
        if (user.departmentRoles && user.departmentRoles.length > 0) {
            return user.departmentRoles[0].role || 'User';
        }
        return user.role || 'User';
    };

    // Helper to get user's department ID from departmentRoles array
    const getUserDepartmentId = (user) => {
        if (user.departmentRoles && user.departmentRoles.length > 0) {
            return user.departmentRoles[0].departmentId || '';
        }
        return user.department_id || '';
    };

    const handleOpenDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                departmentId: getUserDepartmentId(user),
                role: getUserRole(user)
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                departmentId: departments[0]?.id || '',
                role: 'Clerk'
            });
        }
        setErrors({});
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            departmentId: '',
            role: 'Clerk'
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
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!editingUser && !formData.password) newErrors.password = 'Password is required';
        if (!formData.departmentId) newErrors.departmentId = 'Department is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            // Convert flat departmentId/role to departmentRoles array format
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password || undefined,
                departmentRoles: [{
                    departmentId: formData.departmentId,
                    role: formData.role
                }]
            };

            if (editingUser) {
                await api.updateUser(editingUser.id, userData);
                showSuccess('User updated successfully');
            } else {
                await api.createUser(userData);
                showSuccess('User created successfully');
            }
            handleCloseDialog();
            loadData();
        } catch (error) {
            showError(error.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await api.deleteUser(userId);
            showSuccess('User deleted successfully');
            loadData();
        } catch (error) {
            showError(error.message || 'Failed to delete user');
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
                        <PeopleIcon sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            User Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage system users and their roles
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add User
                </Button>
            </Box>

            {/* Users Table */}
            <Card>
                <CardContent>
                    {displayUsers.length === 0 ? (
                        <Alert severity="info">No users found. Create your first user.</Alert>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Department</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Typography fontWeight={500}>{user.name}</Typography>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{getUserDepartment(user)}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={getUserRole(user)?.replace(/_/g, ' ')} 
                                                    size="small" 
                                                    color={getUserRole(user) === 'Admin' ? 'error' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={user.is_active ? 'Active' : 'Inactive'} 
                                                    size="small" 
                                                    color={user.is_active ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleOpenDialog(user)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDelete(user.id)}
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
                    {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                        <TextField
                            fullWidth
                            label={editingUser ? "Password (leave blank to keep)" : "Password"}
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={!!errors.password}
                            helperText={errors.password}
                        />
                        <TextField
                            select
                            fullWidth
                            label="Department"
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            error={!!errors.departmentId}
                            helperText={errors.departmentId}
                        >
                            {departments.map((dept) => (
                                <MenuItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            fullWidth
                            label="Role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            {roles.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                    {role.label}
                                </MenuItem>
                            ))}
                        </TextField>
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

export default UsersPage;
