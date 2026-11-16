import { styled } from "@mui/material/styles";
import { Box, Container, Stack, Tabs } from "@mui/material";

// Layout pieces of the settings page. Colors come from the theme (the app
// bar's default color, and the page background set by CssBaseline).

/** Shown while settings load. */
export const FullPageCenter = styled(Stack)({
  height: "100vh",
  alignItems: "center",
  justifyContent: "center",
});

/** The page: a fixed header above a scrolling area. */
export const PageRoot = styled(Stack)({ height: "100vh", overflow: "hidden" });

export const SectionTabs = styled(Tabs)(({ theme }) => ({ paddingInline: theme.spacing(2) }));

export const ScrollArea = styled(Box)({ flex: 1, overflowY: "auto" });

/** The column of settings sections. */
export const PageContent = styled(Container)(({ theme }) => ({ paddingBlock: theme.spacing(4) }));
