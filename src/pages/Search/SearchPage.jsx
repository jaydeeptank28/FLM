// Search Page
import React, { useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    MenuItem,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Chip,
    Collapse
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as ViewIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useFiles } from '../../contexts/FileContext';
import { useAuth } from '../../contexts/AuthContext';
import StateBadge from '../../components/common/StateBadge';
import PriorityChip from '../../components/common/PriorityChip';
import EmptyState from '../../components/common/EmptyState';
import { FILE_STATES, FILE_TYPES, PRIORITIES } from '../../utils/constants';
import { users } from '../../data/users';

function SearchPage() {
    const navigate = useNavigate();
    const { searchFiles } = useFiles();
    const { getAllDepartments } = useAuth();

    const departments = getAllDepartments();
    const fileTypes = Object.values(FILE_TYPES);
    const priorities = Object.values(PRIORITIES);
    const states = Object.keys(FILE_STATES);

    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState({
        text: '',
        department: '',
        status: '',
        fileType: '',
        priority: '',
        dateFrom: '',
        dateTo: ''
    });

    const [hasSearched, setHasSearched] = useState(false);

    const results = useMemo(() => {
        if (!hasSearched) return [];
        return searchFiles(filters);
    }, [filters, hasSearched, searchFiles]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        setHasSearched(true);
    };

    const handleClear = () => {
        setFilters({
            text: '',
            department: '',
            status: '',
            fileType: '',
            priority: '',
            dateFrom: '',
            dateTo: ''
        });
        setHasSearched(false);
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user?.name || 'Unknown';
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch {
            return dateString;
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
                    <SearchIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Search Files
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Search across all files with advanced filters
                    </Typography>
                </Box>
            </Box>

            {/* Search Form */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    {/* Quick Search */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Search by file number, subject..."
                            name="text"
                            value={filters.text}
                            onChange={handleChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            sx={{ minWidth: 100 }}
                        >
                            Search
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            Filters
                        </Button>
                    </Box>

                    {/* Advanced Filters */}
                    <Collapse in={showFilters}>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Department"
                                    name="department"
                                    value={filters.department}
                                    onChange={handleChange}
                                    size="small"
                                >
                                    <MenuItem value="">All Departments</MenuItem>
                                    {departments.map((dept) => (
                                        <MenuItem key={dept.id} value={dept.code}>
                                            {dept.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleChange}
                                    size="small"
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    {states.map((state) => (
                                        <MenuItem key={state} value={state}>
                                            {state.replace('_', ' ')}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="File Type"
                                    name="fileType"
                                    value={filters.fileType}
                                    onChange={handleChange}
                                    size="small"
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    {fileTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Priority"
                                    name="priority"
                                    value={filters.priority}
                                    onChange={handleChange}
                                    size="small"
                                >
                                    <MenuItem value="">All Priorities</MenuItem>
                                    {priorities.map((priority) => (
                                        <MenuItem key={priority} value={priority}>
                                            {priority}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="From Date"
                                    name="dateFrom"
                                    value={filters.dateFrom}
                                    onChange={handleChange}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="To Date"
                                    name="dateTo"
                                    value={filters.dateTo}
                                    onChange={handleChange}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClear}
                                    sx={{ height: 40 }}
                                >
                                    Clear Filters
                                </Button>
                            </Grid>
                        </Grid>
                    </Collapse>
                </CardContent>
            </Card>

            {/* Results */}
            <Card>
                <CardContent>
                    {!hasSearched ? (
                        <EmptyState
                            icon={SearchIcon}
                            title="Start Searching"
                            description="Enter search terms or apply filters to find files."
                        />
                    ) : results.length === 0 ? (
                        <EmptyState
                            icon={SearchIcon}
                            title="No results found"
                            description="Try adjusting your search criteria."
                        />
                    ) : (
                        <>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                Found {results.length} file{results.length !== 1 ? 's' : ''}
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>File Number</TableCell>
                                            <TableCell>Subject</TableCell>
                                            <TableCell>Department</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Priority</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created</TableCell>
                                            <TableCell align="right">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {results.map((file) => (
                                            <TableRow key={file.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} color="primary.main">
                                                        {file.fileNumber}
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
                                                        {file.subject}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{file.department}</TableCell>
                                                <TableCell>
                                                    <Chip label={file.fileType} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell>
                                                    <PriorityChip priority={file.priority} />
                                                </TableCell>
                                                <TableCell>
                                                    <StateBadge state={file.currentState} />
                                                </TableCell>
                                                <TableCell>{formatDate(file.createdAt)}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View File">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/files/view/${file.id}`)}
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
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

export default SearchPage;
