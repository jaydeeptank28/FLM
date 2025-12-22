// Daak Create Page - Production API Version
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
    ToggleButton,
    ToggleButtonGroup,
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
    AttachFile as AttachFileIcon,
    Delete as DeleteIcon,
    Mail as InwardIcon,
    MailOutline as OutwardIcon,
    ArrowBack as ArrowBackIcon,
    Description as FileIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useDaak } from '../../contexts/DaakContext';
import { useNotification } from '../../contexts/NotificationContext';
import { DAAK_TYPES, DAAK_MODES } from '../../utils/constants';

function DaakCreatePage() {
    const navigate = useNavigate();
    const { currentDepartment, getAllDepartments } = useAuth();
    const { createDaak } = useDaak();
    const { showSuccess, showError } = useNotification();

    const departments = getAllDepartments();
    const modes = Object.values(DAAK_MODES);

    const [formData, setFormData] = useState({
        type: DAAK_TYPES.INWARD,
        department: currentDepartment || '',
        subject: '',
        referenceNumber: '',
        letterDate: new Date().toISOString().split('T')[0],
        receivedDate: new Date().toISOString().split('T')[0],
        mode: 'Post',
        senderName: '',
        senderAddress: '',
        receiverName: '',
        receiverAddress: '',
        initialNoting: ''
    });

    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleTypeChange = (_, newType) => {
        if (newType) {
            setFormData(prev => ({ ...prev, type: newType }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const handleRemoveAttachment = (attId) => {
        setAttachments(prev => prev.filter(a => a.id !== attId));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
        if (!formData.letterDate) newErrors.letterDate = 'Letter date is required';
        if (!formData.mode) newErrors.mode = 'Mode is required';

        if (formData.type === DAAK_TYPES.INWARD) {
            if (!formData.senderName.trim()) newErrors.senderName = 'Sender name is required';
        } else {
            if (!formData.receiverName.trim()) newErrors.receiverName = 'Receiver name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const result = await createDaak({
                daakType: formData.type,
                subject: formData.subject,
                referenceNumber: formData.referenceNumber,
                letterDate: formData.letterDate,
                receivedDate: formData.receivedDate,
                mode: formData.mode,
                senderName: formData.senderName,
                senderAddress: formData.senderAddress,
                receiverName: formData.receiverName,
                receiverAddress: formData.receiverAddress,
                initialNoting: formData.initialNoting
            });
            
            if (result.success) {
                showSuccess('Daak created successfully');
                navigate(`/daak/${result.daak.id}`);
            } else {
                showError(result.error || 'Failed to create daak');
            }
        } catch (error) {
            showError('Failed to create daak');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isInward = formData.type === DAAK_TYPES.INWARD;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Create New Daak
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Register new correspondence
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Main Form */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            {/* Type Toggle */}
                            <Box sx={{ mb: 3, textAlign: 'center' }}>
                                <ToggleButtonGroup
                                    value={formData.type}
                                    exclusive
                                    onChange={handleTypeChange}
                                    size="large"
                                >
                                    <ToggleButton value={DAAK_TYPES.INWARD}>
                                        <InwardIcon sx={{ mr: 1 }} />
                                        Inward
                                    </ToggleButton>
                                    <ToggleButton value={DAAK_TYPES.OUTWARD}>
                                        <OutwardIcon sx={{ mr: 1 }} />
                                        Outward
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'primary.main' }}>
                                <strong>Daak Number:</strong> Will be auto-generated
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
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

                                {/* Mode */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Mode *"
                                        name="mode"
                                        value={formData.mode}
                                        onChange={handleChange}
                                        error={!!errors.mode}
                                        helperText={errors.mode}
                                    >
                                        {modes.map((mode) => (
                                            <MenuItem key={mode} value={mode}>
                                                {mode}
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
                                        helperText={errors.subject}
                                    />
                                </Grid>

                                {/* Reference Number */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Reference Number"
                                        name="referenceNumber"
                                        value={formData.referenceNumber}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                {/* Letter Date */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Letter Date *"
                                        name="letterDate"
                                        value={formData.letterDate}
                                        onChange={handleChange}
                                        error={!!errors.letterDate}
                                        helperText={errors.letterDate}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                {/* Received Date (Inward only) */}
                                {isInward && (
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Received Date"
                                            name="receivedDate"
                                            value={formData.receivedDate}
                                            onChange={handleChange}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 2 }}>
                                        {isInward ? 'Sender Details' : 'Receiver Details'}
                                    </Typography>
                                </Grid>

                                {/* Sender/Receiver Name */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label={isInward ? 'Sender Name *' : 'Receiver Name *'}
                                        name={isInward ? 'senderName' : 'receiverName'}
                                        value={isInward ? formData.senderName : formData.receiverName}
                                        onChange={handleChange}
                                        error={isInward ? !!errors.senderName : !!errors.receiverName}
                                        helperText={isInward ? errors.senderName : errors.receiverName}
                                    />
                                </Grid>

                                {/* Sender/Receiver Address */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label={isInward ? 'Sender Address' : 'Receiver Address'}
                                        name={isInward ? 'senderAddress' : 'receiverAddress'}
                                        value={isInward ? formData.senderAddress : formData.receiverAddress}
                                        onChange={handleChange}
                                        multiline
                                        rows={2}
                                    />
                                </Grid>

                                {/* Initial Noting */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Initial Noting"
                                        name="initialNoting"
                                        value={formData.initialNoting}
                                        onChange={handleChange}
                                        placeholder="Add initial remarks..."
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} lg={4}>
                    {/* Attachments */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Attachments
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <input
                                type="file"
                                id="daak-file-upload"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="daak-file-upload">
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

                            {attachments.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No attachments
                                </Typography>
                            ) : (
                                <List dense>
                                    {attachments.map((att) => (
                                        <ListItem key={att.id}>
                                            <ListItemIcon>
                                                <FileIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={att.name}
                                                secondary={`${(att.size / 1024).toFixed(1)} KB`}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={() => handleRemoveAttachment(att.id)}
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

                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                Create Daak
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DaakCreatePage;
