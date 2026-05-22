import { createTheme } from '@mui/material/styles';

export const COLOR_THEMES = {
  blue:   { primary: '#1565C0', secondary: '#0288D1', accent: '#29B6F6', name: 'Ocean Blue' },
  green:  { primary: '#2E7D32', secondary: '#388E3C', accent: '#66BB6A', name: 'Forest Green' },
  purple: { primary: '#6A1B9A', secondary: '#7B1FA2', accent: '#AB47BC', name: 'Royal Purple' },
  teal:   { primary: '#00695C', secondary: '#00796B', accent: '#26A69A', name: 'Teal' },
  orange: { primary: '#E65100', secondary: '#F57C00', accent: '#FFA726', name: 'Sunset Orange' },
  rose:   { primary: '#880E4F', secondary: '#AD1457', accent: '#EC407A', name: 'Rose' },
};

export const buildTheme = (colorKey = 'blue', mode = 'light') => {
  const colors = COLOR_THEMES[colorKey] || COLOR_THEMES.blue;
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary:   { main: colors.primary, light: colors.accent, dark: colors.primary },
      secondary: { main: colors.secondary },
      background: {
        default: isDark ? '#0F1117' : '#F4F6FB',
        paper:   isDark ? '#1A1E2E' : '#FFFFFF',
      },
      text: {
        primary:   isDark ? '#E8EAF0' : '#1A1D23',
        secondary: isDark ? '#9EA3B8' : '#5A6178',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      success: { main: '#43A047' },
      warning: { main: '#FB8C00' },
      error:   { main: '#E53935' },
      info:    { main: colors.accent },
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      h1: { fontFamily: "'DM Serif Display', serif", fontWeight: 400 },
      h2: { fontFamily: "'DM Serif Display', serif", fontWeight: 400 },
      h3: { fontFamily: "'DM Serif Display', serif", fontWeight: 400 },
      h4: { fontWeight: 700, letterSpacing: '-0.5px' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.2px' },
    },
    shape: { borderRadius: 12 },
    shadows: isDark
      ? ['none', '0 1px 4px rgba(0,0,0,0.4)', '0 2px 8px rgba(0,0,0,0.4)', ...Array(22).fill('0 4px 20px rgba(0,0,0,0.5)')]
      : ['none', '0 1px 4px rgba(0,0,0,0.06)', '0 2px 8px rgba(0,0,0,0.08)', '0 4px 16px rgba(0,0,0,0.08)', ...Array(21).fill('0 8px 32px rgba(0,0,0,0.10)')],
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, padding: '8px 20px', fontWeight: 600 },
          contained: {
            boxShadow: `0 4px 14px ${colors.primary}40`,
            '&:hover': { boxShadow: `0 6px 20px ${colors.primary}60`, transform: 'translateY(-1px)' },
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
            backgroundImage: 'none',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            '&:hover': { transform: 'translateY(-2px)' },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              background: isDark ? 'rgba(255,255,255,0.04)' : `${colors.primary}08`,
              fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px',
              color: colors.primary,
            }
          }
        }
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': { background: isDark ? 'rgba(255,255,255,0.03)' : `${colors.primary}06` },
            cursor: 'pointer', transition: 'background 0.15s ease',
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: isDark ? '#151827' : colors.primary,
            color: '#fff',
            borderRight: 'none',
          }
        }
      },
      MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } } } },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
    },
  });
};
