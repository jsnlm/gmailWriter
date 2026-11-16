import React, { useState } from "react";
import {
  List, ListItemButton, ListItemIcon, ListItemText, Paper, Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface Props {
  categories: string[];
  selected: string | null;
  customInstructions: string;
  onSelect: (category: string) => void;
  onCustomInstructions: (text: string) => void;
  showSuggestions: boolean;
  heading?: string;
}

/**
 * Suggested responses as a Material list (hover and selected tints come from
 * the theme), with "Add your own instructions" as the last row.
 */
export function CategorySelector({
  categories, selected, customInstructions, onSelect, onCustomInstructions, showSuggestions,
  heading = "How do you want to respond?",
}: Props) {
  // Show the instructions box straight away if there's a remembered prompt in it
  const [showCustom, setShowCustom] = useState(!showSuggestions || customInstructions.trim() !== "");

  return (
    <Stack spacing={1}>
      <Typography variant="overline">{heading}</Typography>

      {showSuggestions && (
        <Paper variant="outlined">
          <List disablePadding dense>
            {categories.map((cat) => (
              <ListItemButton
                key={cat}
                divider
                selected={selected === cat && !showCustom}
                onClick={() => { onSelect(cat); setShowCustom(false); }}
              >
                <ListItemText primary={cat} />
              </ListItemButton>
            ))}
            <ListItemButton selected={showCustom} onClick={() => { setShowCustom(true); onSelect(""); }}>
              <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Add your own instructions" />
            </ListItemButton>
          </List>
        </Paper>
      )}

      {showCustom && (
        <TextField
          multiline
          minRows={4}
          maxRows={12}
          fullWidth
          placeholder="Describe what you want to say…"
          value={customInstructions}
          onChange={(e) => onCustomInstructions(e.target.value)}
          autoFocus
        />
      )}
    </Stack>
  );
}
