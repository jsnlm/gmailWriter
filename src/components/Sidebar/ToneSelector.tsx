import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const TONES = ["Casual", "Friendly", "Formal", "Professional", "Concise", "Warm"];

interface Props {
  tone: string;
  onChange: (tone: string) => void;
}

export function ToneSelector({ tone, onChange }: Props) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel>Tone</InputLabel>
      <Select
        value={tone}
        label="Tone"
        onChange={(e) => onChange(e.target.value)}
        MenuProps={{ disablePortal: true }}
      >
        {TONES.map((t) => (
          <MenuItem key={t} value={t}>{t}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
