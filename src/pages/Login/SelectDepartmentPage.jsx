// Department Selection Page
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip
} from '@mui/material';
import {
    Description as FileIcon,
    Business as BusinessIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function SelectDepartmentPage() {
    const navigate = useNavigate();
    const { currentUser, selectDepartment, getUserDepartments, getRoleInDepartment, isAuthenticated } = useAuth();
    const [selected, setSelected] = useState('');

    const departments = getUserDepartments();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        } else if (isAuthenticated && departments.length <= 1) {
            navigate('/dashboard');
        }
    }, [currentUser, isAuthenticated, departments, navigate]);

    const handleSelect = (dept) => {
        setSelected(dept);
    };

    const handleContinue = () => {
        if (selected) {
            selectDepartment(selected);
            navigate('/dashboard');
        }
    };

    if (!currentUser) {
        return null;
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
            <Card sx={{ maxWidth: 600, width: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Header */}
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
                        <Typography variant="h5" fontWeight={700}>
                            Welcome, {currentUser.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Select a department to continue
                        </Typography>
                    </Box>

                    {/* Department Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {departments.map((dept) => {
                            const role = getRoleInDepartment(dept);
                            const isSelected = selected === dept;

                            return (
                                <Grid item xs={12} sm={6} key={dept}>
                                    <Card
                                        variant="outlined"
                                        onClick={() => handleSelect(dept)}
                                        sx={{
                                            cursor: 'pointer',
                                            borderWidth: 2,
                                            borderColor: isSelected ? 'primary.main' : 'divider',
                                            bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                boxShadow: 2,
                                            },
                                        }}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 1,
                                                        bgcolor: isSelected ? 'primary.main' : 'grey.100',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <BusinessIcon
                                                        sx={{
                                                            color: isSelected ? 'white' : 'text.secondary',
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {dept}
                                                    </Typography>
                                                    <Chip
                                                        label={role}
                                                        size="small"
                                                        color={isSelected ? 'primary' : 'default'}
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Continue Button */}
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={!selected}
                        onClick={handleContinue}
                        endIcon={<ArrowForwardIcon />}
                        sx={{ py: 1.5 }}
                    >
                        Continue to Dashboard
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
}

export default SelectDepartmentPage;
