import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#1a237e' },
    secondary: { main: '#00695c' },
    background: { default: '#f5f6fa' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      defaultProps: { variant: 'outlined' },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
})
