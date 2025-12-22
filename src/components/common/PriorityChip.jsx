// Priority Chip Component
// Displays priority with appropriate color

import React from 'react';
import { Chip } from '@mui/material';
import { PRIORITY_COLORS } from '../../utils/constants';

function PriorityChip({ priority, size = 'small' }) {
    const color = PRIORITY_COLORS[priority] || 'default';

    return (
        <Chip
            label={priority}
            color={color}
            size={size}
            variant="outlined"
            sx={{
                fontWeight: 500,
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
            }}
        />
    );
}

export default PriorityChip;
