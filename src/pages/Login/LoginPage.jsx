// Login Page
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';
import { Description as FileIcon, Login as LoginIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function LoginPage() {
    const navigate = useNavigate();
    const { login, getAllUsers, isAuthenticated, needsDepartmentSelection } = useAuth();
    const [selectedUser, setSelectedUser] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const users = getAllUsers();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else if (needsDepartmentSelection) {
            navigate('/select-department');
        }
    }, [isAuthenticated, needsDepartmentSelection, navigate]);

    const handleLogin = () => {
        if (!selectedUser) {
            setError('Please select a user');
            return;
        }

        setLoading(true);
        setError('');

        // Simulate login delay
        setTimeout(() => {
            const success = login(selectedUser);
            if (success) {
                // Check if user needs to select department
                const user = users.find(u => u.id === selectedUser);
                if (user && user.departmentRoles.length > 1) {
                    navigate('/select-department');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError('Login failed. Please try again.');
            }
            setLoading(false);
        }, 500);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 2,
            }}
        >
            <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Logo */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 2,
                                bgcolor: 'primary.main',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                            }}
                        >
                            <FileIcon sx={{ fontSize: 36, color: 'white' }} />
                        </Box>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                            FLM System
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            File Lifecycle Management
                        </Typography>
                    </Box>

                    {/* Login Form */}
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Sign In
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Select your user account to continue
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        select
                        fullWidth
                        label="Select User"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        sx={{ mb: 3 }}
                    >
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                <Box>
                                    <Typography variant="body1">{user.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {user.departmentRoles.map(dr => `${dr.department} - ${dr.role}`).join(', ')}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleLogin}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                        sx={{ py: 1.5 }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>

                    {/* Demo Notice */}
                    <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            <strong>Demo Mode:</strong> This is a simulation with no actual authentication.
                            Select any user to explore the system.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

export default LoginPage;
