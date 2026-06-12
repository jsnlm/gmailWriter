import React from "react";
import { Box, Typography, FormControlLabel, Switch, Paper } from "@mui/material";

interface Props {
  showSuggestedResponses: boolean;
  onChange: (val: boolean) => void;
}

export function DisplaySettingsSection({ showSuggestedResponses, onChange }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" fontWeight={600}>Display</Typography>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showSuggestedResponses}
              onChange={(e) => onChange(e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={500}>Show suggested responses</Typography>
              <Typography variant="caption" color="text.secondary">
                When enabled, the AI will analyze the email thread and suggest response categories before drafting.
              </Typography>
              <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 0.5 }}>
                Uses an additional AI request and extra tokens.
              </Typography>
            </Box>
          }
          labelPlacement="start"
          sx={{ width: "100%", justifyContent: "space-between", ml: 0 }}
        />
      </Paper>
    </Box>
  );
}
