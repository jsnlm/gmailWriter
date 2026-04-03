import { createTheme } from "@mui/material/styles";

export const gmailTheme = createTheme({
  palette: {
    primary: {
      main: "#1a73e8",
      light: "#4285f4",
      dark: "#1557b0",
      contrastText: "#fff",
    },
    secondary: { main: "#ea4335" },
    background: { default: "#f8f9fa", paper: "#ffffff" },
    text: { primary: "#202124", secondary: "#5f6368" },
    divider: "#e0e0e0",
  },
  typography: {
    fontFamily: '"Google Sans", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500, boxShadow: "none" },
        contained: {
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1.5px solid #e0e0e0", borderRadius: 10 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
    },
    MuiSelect: {
      defaultProps: { size: "small" },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 500 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1a73e8",
          },
        },
      },
    },
  },
});
