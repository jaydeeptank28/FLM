// Daak List Page - Shows Inward/Outward correspondence
import React, { useMemo } from 'react';
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
    Tab
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
import { users } from '../../data/users';

function DaakListPage() {
    const { type } = useParams();
    const navigate = useNavigate();
    const { getDaakByType } = useDaak();

    const [tabValue, setTabValue] = React.useState(type === 'outward' ? 1 : 0);

    const daakType = tabValue === 0 ? DAAK_TYPES.INWARD : DAAK_TYPES.OUTWARD;
    const daakList = useMemo(() => getDaakByType(daakType), [daakType, getDaakByType]);

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user?.name || 'Unknown';
    };

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

                {daakList.length === 0 ? (
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
                                    <TableCell>Reference</TableCell>
                                    <TableCell>{tabValue === 0 ? 'Sender' : 'Receiver'}</TableCell>
                                    <TableCell>Letter Date</TableCell>
                                    <TableCell>Mode</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Linked File</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {daakList.map((daak) => (
                                    <TableRow
                                        key={daak.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/daak/${daak.id}`)}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                {daak.daakNumber}
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
                                            <Typography variant="body2" color="text.secondary">
                                                {daak.referenceNumber || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {tabValue === 0 ? daak.senderName : daak.receiverName}
                                        </TableCell>
                                        <TableCell>{formatDate(daak.letterDate)}</TableCell>
                                        <TableCell>
                                            <Chip label={daak.mode} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <StateBadge state={daak.currentState} type="daak" />
                                        </TableCell>
                                        <TableCell>
                                            {daak.linkedFileId ? (
                                                <Chip
                                                    label="Linked"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/files/view/${daak.linkedFileId}`);
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
