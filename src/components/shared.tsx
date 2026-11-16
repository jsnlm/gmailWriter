import React from "react";
import { styled } from "@mui/material/styles";
import { Typography } from "@mui/material";

// Small pieces shared by the sidebar and the settings page.

const LogoImage = styled("img")(({ theme }) => ({ marginRight: theme.spacing(1) }));

/** The extension's icon, at the start of a toolbar. */
export function AppLogo({ size = 20 }: { size?: number }) {
  return <LogoImage src={chrome.runtime.getURL("public/icons/icon128.png")} alt="" width={size} height={size} />;
}

/** A toolbar's title, filling the space so actions after it sit at the far end. */
export const ToolbarTitle = styled(Typography)({ flexGrow: 1 });
