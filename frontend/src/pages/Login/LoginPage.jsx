// Login Page - Production Version with Email/Password
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Description as FileIcon,
    Login as LoginIcon,
    Visibility,
    VisibilityOff,
    Email as EmailIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated, needsDepartmentSelection, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else if (needsDepartmentSelection) {
            navigate('/select-department');
        }
    }, [isAuthenticated, needsDepartmentSelection, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email');
            return;
        }
        if (!password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (result.success) {
            // Check if user needs to select department
            if (result.user.departmentRoles?.length > 1) {
                navigate('/select-department');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }
        setLoading(false);
    };

    if (authLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <CircularProgress sx={{ color: 'white' }} />
            </Box>
        );
    }

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
                        Enter your credentials to access the system
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            autoComplete="email"
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 3 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            autoComplete="current-password"
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                            sx={{ py: 1.5 }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    {/* Initial Credentials Notice */}
                    <Box sx={{ mt: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
                        <Typography variant="caption" color="info.dark" display="block">
                            <strong>Initial Admin Credentials:</strong>
                        </Typography>
                        <Typography variant="caption" color="info.dark" display="block" sx={{ fontFamily: 'monospace' }}>
                            Email: admin@flm.local
                        </Typography>
                        <Typography variant="caption" color="info.dark" display="block" sx={{ fontFamily: 'monospace' }}>
                            Password: admin123
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

export default LoginPage;
