import { createTheme } from "@mui/material/styles";

// The look shared by the sidebar and the settings page. Components use
// Material's own components and variants; anything they'd otherwise restyle
// each time is set once here, as defaults.

export const gmailTheme = createTheme({
  palette: {
    primary: {
      main: "#1a73e8",
      light: "#4285f4",
      dark: "#1557b0",
      contrastText: "#fff",
    },
    background: { default: "#f8f9fa", paper: "#ffffff" },
    text: { primary: "#202124", secondary: "#5f6368" },
    divider: "#e0e0e0",
  },
  typography: {
    fontFamily: '"Google Sans", Roboto, "Helvetica Neue", Arial, sans-serif',
    // Buttons, tabs and toggle buttons read in sentence case, like Gmail's
    button: { textTransform: "none", fontWeight: 500 },
    h6: { fontWeight: 600 },
    // Small uppercase section labels ("TONE", "DRAFT 1"): <Typography variant="overline">
    overline: { fontWeight: 600, letterSpacing: "0.5px", lineHeight: 1.66 },
  },
  shape: { borderRadius: 8 },
  components: {
    // Flat buttons, as in Gmail
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiTypography: {
      styleOverrides: {
        overline: ({ theme }) => ({ color: theme.palette.text.secondary, display: "block" }),
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
    },
    // A grey strip across the top of a card, holding an overline title
    MuiCardHeader: {
      defaultProps: { disableTypography: true },
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(1, 2),
          backgroundColor: theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
    },
    MuiSelect: {
      defaultProps: { size: "small" },
    },
    MuiToggleButtonGroup: {
      defaultProps: { size: "small", color: "primary" },
    },
  },
});
