import { styled } from "@mui/material/styles";
import { Button, TextField } from "@mui/material";

// Pieces shared by the settings sections.

/** "Add field" / "Add sample email": a text button under its list, not stretched across it. */
export const AddRowButton = styled(Button)({ alignSelf: "flex-start" });

/** Personal info: the fixed-width label next to its value. */
export const InfoLabelField = styled(TextField)({ width: 160, flexShrink: 0 });
