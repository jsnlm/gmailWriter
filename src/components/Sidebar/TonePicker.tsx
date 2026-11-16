import React, { useState } from "react";
import { Box, ButtonBase, Popover, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { TONE_QUALITIES, chosenOption, summarizeTone, type Tone } from "../../services/tone";

interface Props {
  tone: Tone;
  onChange: (tone: Tone) => void;
}

/**
 * A pill that sums up the tone in five words ("Casual · Warm · Brief · …").
 * Clicking it opens a popover with a scale for each quality.
 */
export function TonePicker({ tone, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        Tone
      </Typography>

      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        sx={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          border: 1,
          borderColor: "divider",
          borderRadius: 999,
          fontSize: 13,
          textAlign: "left",
          color: "text.primary",
          "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
        }}
      >
        <TuneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        {summarizeTone(tone).map((word, i) => (
          <React.Fragment key={word}>
            {i > 0 && <Box component="span" sx={{ color: "text.disabled" }}>·</Box>}
            <span>{word}</span>
          </React.Fragment>
        ))}
        <ExpandMoreIcon sx={{ fontSize: 16, color: "text.secondary" }} />
      </ButtonBase>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        // Render inside the sidebar's shadow root, where its styles live
        disablePortal
        slotProps={{ paper: { sx: { p: 1.5, mt: 0.5, width: 340, maxWidth: "calc(100% - 16px)" } } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {TONE_QUALITIES.map((quality) => (
            <Box key={quality.key} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">{quality.label}</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                color="primary"
                value={tone[quality.key]}
                // Every quality always has a value, so ignore clicks that would clear it
                onChange={(_, value: string | null) => { if (value) onChange({ ...tone, [quality.key]: value }); }}
              >
                {quality.options.map((option) => (
                  <ToggleButton
                    key={option.value}
                    value={option.value}
                    title={option.hint} // the browser's own tooltip
                    sx={{ textTransform: "none", fontSize: 12, px: 0.5, whiteSpace: "nowrap" }}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {quality.options.some((o) => o.hint) && (
                <Typography variant="caption" color="text.secondary">
                  {chosenOption(quality, tone).hint}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}
