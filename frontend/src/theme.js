// Material UI Theme Configuration
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#7c4dff',
            light: '#b47cff',
            dark: '#3f1dcb',
        },
        success: {
            main: '#2e7d32',
            light: '#4caf50',
            dark: '#1b5e20',
        },
        warning: {
            main: '#ed6c02',
            light: '#ff9800',
            dark: '#e65100',
        },
        error: {
            main: '#d32f2f',
            light: '#ef5350',
            dark: '#c62828',
        },
        info: {
            main: '#0288d1',
            light: '#03a9f4',
            dark: '#01579b',
        },
        background: {
            default: '#f5f7fa',
            paper: '#ffffff',
        },
        text: {
            primary: '#1a1a2e',
            secondary: '#666666',
        },
        divider: 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        subtitle1: {
            fontWeight: 500,
            fontSize: '1rem',
        },
        subtitle2: {
            fontWeight: 500,
            fontSize: '0.875rem',
        },
        body1: {
            fontSize: '0.975rem',
        },
        body2: {
            fontSize: '0.875rem',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0px 1px 3px rgba(0, 0, 0, 0.08)',
        '0px 2px 6px rgba(0, 0, 0, 0.08)',
        '0px 4px 12px rgba(0, 0, 0, 0.08)',
        '0px 6px 16px rgba(0, 0, 0, 0.10)',
        '0px 8px 24px rgba(0, 0, 0, 0.12)',
        '0px 12px 32px rgba(0, 0, 0, 0.14)',
        '0px 16px 40px rgba(0, 0, 0, 0.16)',
        '0px 20px 48px rgba(0, 0, 0, 0.18)',
        '0px 24px 56px rgba(0, 0, 0, 0.20)',
        '0px 28px 64px rgba(0, 0, 0, 0.22)',
        '0px 32px 72px rgba(0, 0, 0, 0.24)',
        '0px 36px 80px rgba(0, 0, 0, 0.26)',
        '0px 40px 88px rgba(0, 0, 0, 0.28)',
        '0px 44px 96px rgba(0, 0, 0, 0.30)',
        '0px 48px 104px rgba(0, 0, 0, 0.32)',
        '0px 52px 112px rgba(0, 0, 0, 0.34)',
        '0px 56px 120px rgba(0, 0, 0, 0.36)',
        '0px 60px 128px rgba(0, 0, 0, 0.38)',
        '0px 64px 136px rgba(0, 0, 0, 0.40)',
        '0px 68px 144px rgba(0, 0, 0, 0.42)',
        '0px 72px 152px rgba(0, 0, 0, 0.44)',
        '0px 76px 160px rgba(0, 0, 0, 0.46)',
        '0px 80px 168px rgba(0, 0, 0, 0.48)',
        '0px 84px 176px rgba(0, 0, 0, 0.50)',
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 20px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                rounded: {
                    borderRadius: 12,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: '#f8fafc',
                    '& .MuiTableCell-head': {
                        fontWeight: 600,
                        color: '#374151',
                    },
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    minHeight: 48,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                },
            },
        },
    },
});

export default theme;
