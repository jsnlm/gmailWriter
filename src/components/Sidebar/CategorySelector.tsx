import React, { useState } from "react";
import {
  Box, ButtonBase, TextField, Typography, Paper,
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

export function CategorySelector({
  categories, selected, customInstructions, onSelect, onCustomInstructions, showSuggestions,
  heading = "How do you want to respond?",
}: Props) {
  const [showCustom, setShowCustom] = useState(!showSuggestions);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {heading}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {showSuggestions && (
          <>
            {categories.map((cat) => {
              const isSelected = selected === cat && !showCustom;
              return (
                <Paper
                  key={cat}
                  component={ButtonBase}
                  variant="outlined"
                  onClick={() => { onSelect(cat); setShowCustom(false); }}
                  sx={{
                    textAlign: "left",
                    p: "10px 14px",
                    borderRadius: 2,
                    fontSize: 13,
                    lineHeight: 1.4,
                    width: "100%",
                    display: "block",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    bgcolor: isSelected ? "primary.50" : "background.paper",
                    borderColor: isSelected ? "primary.main" : "divider",
                    color: isSelected ? "primary.main" : "text.primary",
                    fontWeight: isSelected ? 500 : 400,
                    "&:hover": {
                      bgcolor: "primary.50",
                      borderColor: "primary.main",
                      color: "primary.main",
                    },
                  }}
                >
                  {cat}
                </Paper>
              );
            })}
            <Paper
              component={ButtonBase}
              variant="outlined"
              onClick={() => { setShowCustom(true); onSelect(""); }}
              sx={{
                textAlign: "left",
                p: "10px 14px",
                borderRadius: 2,
                fontSize: 13,
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                transition: "all 0.15s",
                bgcolor: showCustom ? "primary.50" : "background.paper",
                borderColor: showCustom ? "primary.main" : "divider",
                borderStyle: "dashed",
                color: showCustom ? "primary.main" : "text.secondary",
                "&:hover": { bgcolor: "primary.50", borderColor: "primary.main", color: "primary.main" },
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
              Add your own instructions
            </Paper>
          </>
        )}
      </Box>

      {showCustom && (
        <TextField
          multiline
          rows={6}
          fullWidth
          placeholder="Describe what you want to say…"
          value={customInstructions}
          onChange={(e) => onCustomInstructions(e.target.value)}
          autoFocus
          size="small"
          slotProps={{ htmlInput: { style: { resize: "vertical" } } }}
        />
      )}
    </Box>
  );
}
