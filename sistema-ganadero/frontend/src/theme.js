import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      lightest: '#E8F5E9',
      light:    '#4CAF50',
      main:     '#2E7D32',
      dark:     '#1B5E20',
      contrastText: '#fff',
    },
    secondary: {
      light:    '#FF8F00',
      main:     '#E65100',
      dark:     '#BF360C',
      contrastText: '#fff',
    },
    error:   { main: '#C62828' },
    warning: { main: '#FF8F00' },
    info:    { main: '#1565C0' },
    success: { main: '#2E7D32' },
    background: {
      default: '#F8FAFC',
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#1A2027',
      secondary: '#64748B',
    },
    divider: '#E2E8F0',
  },

  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    h4:        { fontWeight: 700 },
    h5:        { fontWeight: 700 },
    h6:        { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button:    { textTransform: 'none', fontWeight: 600 },
  },

  shape: { borderRadius: 10 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        html: { WebkitFontSmoothing: 'antialiased' },
        '::-webkit-scrollbar':       { width: 4, height: 4 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 8 },
        '::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
        sizeSmall: { fontSize: '0.8125rem' },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #E2E8F0', borderRadius: 12 },
      },
    },

    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#64748B',
          backgroundColor: '#F8FAFC',
        },
        body: { fontSize: '0.8125rem' },
      },
    },

    MuiChip: {
      styleOverrides: {
        root:         { borderRadius: 6, fontWeight: 500 },
        sizeSmall:    { fontSize: '0.72rem' },
        colorSuccess: { backgroundColor: '#DCFCE7', color: '#166534' },
        colorWarning: { backgroundColor: '#FEF3C7', color: '#92400E' },
        colorError:   { backgroundColor: '#FEE2E2', color: '#991B1B' },
        colorInfo:    { backgroundColor: '#DBEAFE', color: '#1E40AF' },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },

    MuiSelect: {
      defaultProps: { size: 'small' },
    },

    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 8 } },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#1A2027',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,.20)',
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '7px 12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(134,239,172,0.14)',
            '&:hover': { backgroundColor: 'rgba(134,239,172,0.20)' },
          },
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 36, color: 'inherit' },
      },
    },

    MuiTooltip: {
      defaultProps: { arrow: true, placement: 'right' },
      styleOverrides: {
        tooltip:   { fontSize: '0.75rem', borderRadius: 6 },
        arrow:     { color: '#1E293B' },
        tooltipPlacementRight: { marginLeft: '8px !important' },
      },
    },

    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },

    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, paddingBottom: 8 } },
    },

    MuiDialogActions: {
      styleOverrides: { root: { padding: '12px 24px' } },
    },

    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10 } },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E2E8F0' } },
    },
  },
})

export default theme
