import React from "react";
import { Box, TextField, IconButton, Button, Typography, Divider } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { PersonalInfoEntry } from "../../types";

interface Props {
  entries: PersonalInfoEntry[];
  onChange: (entries: PersonalInfoEntry[]) => void;
}

export function PersonalInfoSection({ entries, onChange }: Props) {
  const update = (index: number, field: keyof PersonalInfoEntry, value: string) =>
    onChange(entries.map((e, i) => (i === index ? { ...e, [field]: value } : e)));

  const remove = (index: number) => onChange(entries.filter((_, i) => i !== index));

  const add = () => onChange([...entries, { key: "", value: "" }]);

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Typography variant="h6" className="font-semibold mb-1">Personal Info</Typography>
        <Typography variant="body2" color="text.secondary">
          These details can be included in drafted emails (e.g. phone number, Calendly link). Add or remove fields freely.
        </Typography>
      </Box>

      <Divider />

      <Box className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <Box key={i} className="flex gap-2 items-center">
            <TextField
              placeholder="Label (e.g. Phone)"
              value={entry.key}
              onChange={(e) => update(i, "key", e.target.value)}
              sx={{ width: 160, flexShrink: 0 }}
            />
            <TextField
              placeholder="Value"
              value={entry.value}
              onChange={(e) => update(i, "value", e.target.value)}
              fullWidth
            />
            <IconButton onClick={() => remove(i)} color="default" size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={add}
        sx={{ alignSelf: "flex-start", borderStyle: "dashed" }}
      >
        Add field
      </Button>
    </Box>
  );
}
