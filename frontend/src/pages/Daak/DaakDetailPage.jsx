// Daak Detail Page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Divider,
    Chip,
    IconButton,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Mail as InwardIcon,
    MailOutline as OutwardIcon,
    Edit as EditIcon,
    Link as LinkIcon,
    AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDaak } from '../../contexts/DaakContext';
import { useFiles } from '../../contexts/FileContext';
import { useNotification } from '../../contexts/NotificationContext';
import StateBadge from '../../components/common/StateBadge';

function DaakDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getDaakById, changeState, linkToFile, loading } = useDaak();
    const { searchFiles } = useFiles();
    const { showSuccess, showError } = useNotification();

    const [daak, setDaak] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [selectedFileId, setSelectedFileId] = useState('');
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        loadDaak();
    }, [id]);

    const loadDaak = async () => {
        setIsLoading(true);
        try {
            const data = await getDaakById(id);
            setDaak(data);
        } catch (error) {
            console.error('Error loading daak:', error);
            showError('Failed to load daak details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLinkToFile = async () => {
        if (!selectedFileId) return;
        
        try {
            await linkToFile(id, selectedFileId);
            showSuccess('Daak linked to file successfully');
            setLinkDialogOpen(false);
            loadDaak();
        } catch (error) {
            showError('Failed to link daak to file');
        }
    };

    const handleChangeStatus = async () => {
        if (!newStatus) return;
        
        try {
            await changeState(id, newStatus, remarks);
            showSuccess('Status updated successfully');
            setStatusDialogOpen(false);
            loadDaak();
        } catch (error) {
            showError('Failed to update status');
        }
    };

    const openLinkDialog = async () => {
        try {
            const files = await searchFiles({ text: '' });
            setAvailableFiles(files || []);
        } catch (error) {
            console.error('Error loading files:', error);
        }
        setLinkDialogOpen(true);
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch {
            return dateString || '-';
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!daak) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6">Daak not found</Typography>
                <Button onClick={() => navigate('/daak/inward')} sx={{ mt: 2 }}>
                    Back to Daak List
                </Button>
            </Box>
        );
    }

    const isInward = daak.type === 'INWARD' || daak.daak_type === 'INWARD';
    const daakNumber = daak.daak_number || daak.daakNumber;
    const currentState = daak.current_state || daak.currentState;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: isInward ? 'info.main' : 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {isInward ? <InwardIcon sx={{ color: 'white' }} /> : <OutwardIcon sx={{ color: 'white' }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                        {daakNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isInward ? 'Inward' : 'Outward'} Correspondence
                    </Typography>
                </Box>
                <StateBadge state={currentState} type="daak" />
            </Box>

            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Details
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Subject</Typography>
                                    <Typography variant="body1" fontWeight={500}>
                                        {daak.subject}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Reference Number</Typography>
                                    <Typography variant="body1">
                                        {daak.reference_number || daak.referenceNumber || '-'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Mode</Typography>
                                    <Chip label={daak.mode} size="small" />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Letter Date</Typography>
                                    <Typography variant="body1">
                                        {formatDate(daak.letter_date || daak.letterDate)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        {isInward ? 'Received Date' : 'Dispatch Date'}
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(isInward 
                                            ? (daak.received_date || daak.receivedDate)
                                            : (daak.dispatch_date || daak.dispatchDate)
                                        )}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                {isInward ? 'Sender Details' : 'Receiver Details'}
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        {isInward ? 'Sender Name' : 'Receiver Name'}
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500}>
                                        {isInward 
                                            ? (daak.sender_name || daak.senderName)
                                            : (daak.receiver_name || daak.receiverName) || '-'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        {isInward ? 'Sender Address' : 'Receiver Address'}
                                    </Typography>
                                    <Typography variant="body1">
                                        {isInward 
                                            ? (daak.sender_address || daak.senderAddress)
                                            : (daak.receiver_address || daak.receiverAddress) || '-'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {daak.initial_noting && (
                                <>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Initial Noting
                                    </Typography>
                                    <Typography variant="body1">
                                        {daak.initial_noting}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} lg={4}>
                    {/* Actions */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Actions
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<LinkIcon />}
                                    onClick={openLinkDialog}
                                >
                                    Link to File
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => setStatusDialogOpen(true)}
                                >
                                    Change Status
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Linked File */}
                    {(daak.linked_file_id || daak.linkedFileId) && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Linked File
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => navigate(`/files/view/${daak.linked_file_id || daak.linkedFileId}`)}
                                >
                                    View Linked File
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Link to File Dialog */}
            <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Link Daak to File</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        fullWidth
                        label="Select File"
                        value={selectedFileId}
                        onChange={(e) => setSelectedFileId(e.target.value)}
                        sx={{ mt: 2 }}
                    >
                        {availableFiles.map((file) => (
                            <MenuItem key={file.id} value={file.id}>
                                {file.file_number || file.fileNumber} - {file.subject}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleLinkToFile} disabled={!selectedFileId}>
                        Link
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Status Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Change Daak Status</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        fullWidth
                        label="New Status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        sx={{ mt: 2, mb: 2 }}
                    >
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="PROCESSED">Processed</MenuItem>
                        <MenuItem value="DISPATCHED">Dispatched</MenuItem>
                        <MenuItem value="CLOSED">Closed</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth
                        label="Remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleChangeStatus} disabled={!newStatus}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default DaakDetailPage;
