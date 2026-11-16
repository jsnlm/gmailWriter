import { styled } from "@mui/material/styles";
import { ToggleButton } from "@mui/material";
import { PopoverPaper } from "@mui/material/Popover";

/**
 * The popover's panel holding the tone scales. Built on MUI's PopoverPaper,
 * not plain Paper: its base styles (position: absolute) are what let the
 * popover place itself under the button.
 */
export const TonePopoverPaper = styled(PopoverPaper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(0.5),
  width: 340,
  maxWidth: "calc(100% - 16px)",
}));

/** One option on a scale, with tighter padding so Length's five fit in one row. */
export const ToneOption = styled(ToggleButton)(({ theme }) => ({
  paddingInline: theme.spacing(0.5),
}));
