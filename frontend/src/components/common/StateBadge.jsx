// State Badge Component
// Displays file/daak state with appropriate color

import React from 'react';
import { Chip } from '@mui/material';
import { FILE_STATE_LABELS, FILE_STATE_COLORS, DAAK_STATE_LABELS, DAAK_STATE_COLORS } from '../../utils/constants';

function StateBadge({ state, type = 'file', size = 'small' }) {
    const labels = type === 'file' ? FILE_STATE_LABELS : DAAK_STATE_LABELS;
    const colors = type === 'file' ? FILE_STATE_COLORS : DAAK_STATE_COLORS;

    const label = labels[state] || state;
    const color = colors[state] || 'default';

    return (
        <Chip
            label={label}
            color={color}
            size={size}
            sx={{
                fontWeight: 500,
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
            }}
        />
    );
}

export default StateBadge;
