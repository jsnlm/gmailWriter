import React from "react";
import { List, ListItem, ListItemText, Paper, Switch, Typography } from "@mui/material";
import { SettingsSection } from "./SettingsSection";

interface Props {
  showSuggestedResponses: boolean;
  onChange: (val: boolean) => void;
}

export function DisplaySettingsSection({ showSuggestedResponses, onChange }: Props) {
  return (
    <SettingsSection title="Display">
      <Paper variant="outlined">
        <List disablePadding>
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={showSuggestedResponses}
                onChange={(e) => onChange(e.target.checked)}
                slotProps={{ input: { "aria-label": "Show suggested responses" } }}
              />
            }
          >
            <ListItemText
              primary="Show suggested responses"
              secondary={
                <>
                  When enabled, the AI will analyze the email thread and suggest response categories before drafting.
                  <Typography component="span" variant="caption" color="warning.main" display="block">
                    Uses an additional AI request and extra tokens.
                  </Typography>
                </>
              }
            />
          </ListItem>
        </List>
      </Paper>
    </SettingsSection>
  );
}
