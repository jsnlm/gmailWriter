import React, { useState } from "react";
import { Button, Popover, Stack, ToggleButtonGroup, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { TONE_QUALITIES, chosenOption, summarizeTone, type Tone } from "../../services/tone";
import { TonePopoverPaper, ToneOption } from "./TonePicker.styles";

interface Props {
  tone: Tone;
  onChange: (tone: Tone) => void;
}

/**
 * A button that sums up the tone in five words ("Casual · Warm · Brief · …").
 * Clicking it opens a popover with a scale for each quality.
 */
export function TonePicker({ tone, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Stack spacing={0.75} alignItems="flex-start">
      <Typography variant="overline">Tone</Typography>

      <Button
        variant="outlined"
        startIcon={<TuneIcon />}
        endIcon={<ExpandMoreIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
      >
        {summarizeTone(tone).join(" · ")}
      </Button>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        // Render inside the sidebar's shadow root, where its styles live
        disablePortal
        slots={{ paper: TonePopoverPaper }}
      >
        <Stack spacing={1.25}>
          {TONE_QUALITIES.map((quality) => (
            <Stack key={quality.key} spacing={0.5}>
              <Typography variant="caption" color="text.secondary">{quality.label}</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={tone[quality.key]}
                // Every quality always has a value, so ignore clicks that would clear it
                onChange={(_, value: string | null) => { if (value) onChange({ ...tone, [quality.key]: value }); }}
              >
                {quality.options.map((option) => (
                  <ToneOption key={option.value} value={option.value} title={option.hint}>
                    {option.label}
                  </ToneOption>
                ))}
              </ToggleButtonGroup>
              {quality.options.some((o) => o.hint) && (
                <Typography variant="caption" color="text.secondary">
                  {chosenOption(quality, tone).hint}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      </Popover>
    </Stack>
  );
}
