import React from "react";
import { Divider, Stack, Typography } from "@mui/material";

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/** One section of the settings page: a title, an optional description, a divider, then its fields. */
export function SettingsSection({ title, description, children }: Props) {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h6" gutterBottom={!!description}>{title}</Typography>
        {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
      </div>
      <Divider />
      {children}
    </Stack>
  );
}
