import { styled } from "@mui/material/styles";
import { Paper, Stack } from "@mui/material";

// Layout pieces of the sidebar panel.
//
// Styling rule for this project: React UI built with MUI is styled with
// styled() components like these (or the theme, for app-wide defaults);
// plain HTML outside React, like the buttons we add to Gmail's page, is
// styled with .scss files.

/** The whole panel: a column whose middle part scrolls. */
export const SidebarRoot = styled(Paper)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

/** Everything below the header, scrolling on its own. */
export const ScrollBody = styled(Stack)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(2),
}));

/** A spinner and message centered in the space left. */
export const CenteredState = styled(Stack)({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
});
