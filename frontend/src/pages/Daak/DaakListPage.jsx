// Daak List Page - Production API Version
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Button,
    Chip,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Add as AddIcon,
    Mail as InwardIcon,
    MailOutline as OutwardIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDaak } from '../../contexts/DaakContext';
import StateBadge from '../../components/common/StateBadge';
import EmptyState from '../../components/common/EmptyState';
import { DAAK_TYPES } from '../../utils/constants';

function DaakListPage() {
    const { type } = useParams();
    const navigate = useNavigate();
    const { fetchDaakList, getInwardDaak, getOutwardDaak, loading, daakList } = useDaak();

    const [tabValue, setTabValue] = useState(type === 'outward' ? 1 : 0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDaak = async () => {
            setIsLoading(true);
            try {
                const daakType = tabValue === 0 ? DAAK_TYPES.INWARD : DAAK_TYPES.OUTWARD;
                await fetchDaakList(daakType);
            } catch (error) {
                console.error('Error loading daak:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDaak();
    }, [tabValue, fetchDaakList]);

    const currentList = tabValue === 0 ? getInwardDaak() : getOutwardDaak();

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch {
            return dateString || '-';
        }
    };

    const handleTabChange = (_, newValue) => {
        setTabValue(newValue);
        navigate(newValue === 0 ? '/daak/inward' : '/daak/outward');
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
                        {tabValue === 0 ? <InwardIcon sx={{ color: 'white' }} /> : <OutwardIcon sx={{ color: 'white' }} />}
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Daak Register
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Inward & Outward Correspondence
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/daak/create')}
                >
                    New Daak
                </Button>
            </Box>

            {/* Tabs */}
            <Card>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab icon={<InwardIcon />} iconPosition="start" label="Inward" />
                    <Tab icon={<OutwardIcon />} iconPosition="start" label="Outward" />
                </Tabs>

                {isLoading ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Loading...
                        </Typography>
                    </Box>
                ) : currentList.length === 0 ? (
                    <EmptyState
                        icon={tabValue === 0 ? InwardIcon : OutwardIcon}
                        title={`No ${tabValue === 0 ? 'inward' : 'outward'} correspondence`}
                        description="Create a new daak entry to get started."
                        actionLabel="New Daak"
                        onAction={() => navigate('/daak/create')}
                    />
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Daak Number</TableCell>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>{tabValue === 0 ? 'Sender' : 'Receiver'}</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Mode</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Linked File</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentList.map((daak) => (
                                    <TableRow
                                        key={daak.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/daak/${daak.id}`)}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                {daak.daak_number || daak.daakNumber}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {daak.subject}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {tabValue === 0 
                                                ? (daak.sender_name || daak.senderName) 
                                                : (daak.receiver_name || daak.receiverName)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(tabValue === 0 
                                                ? (daak.received_date || daak.receivedDate) 
                                                : (daak.dispatch_date || daak.dispatchDate))}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={daak.mode} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <StateBadge state={daak.current_state || daak.currentState} type="daak" />
                                        </TableCell>
                                        <TableCell>
                                            {(daak.linked_file_id || daak.linkedFileId) ? (
                                                <Chip
                                                    label="Linked"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/files/view/${daak.linked_file_id || daak.linkedFileId}`);
                                                    }}
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View Daak">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/daak/${daak.id}`);
                                                    }}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </Box>
    );
}

export default DaakListPage;
