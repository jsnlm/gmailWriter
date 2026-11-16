import React from "react";
import { Stack, TextField, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { PersonalInfoEntry } from "../../types";
import { SettingsSection } from "./SettingsSection";
import { AddRowButton, InfoLabelField } from "./Settings.styles";

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
    <SettingsSection
      title="Personal Info"
      description="These details can be included in drafted emails (e.g. phone number, Calendly link). Add or remove fields freely."
    >
      <Stack spacing={1.5}>
        {entries.map((entry, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="center">
            <InfoLabelField
              placeholder="Label (e.g. Phone)"
              value={entry.key}
              onChange={(e) => update(i, "key", e.target.value)}
            />
            <TextField
              placeholder="Value"
              value={entry.value}
              onChange={(e) => update(i, "value", e.target.value)}
              fullWidth
            />
            <IconButton onClick={() => remove(i)} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <AddRowButton startIcon={<AddIcon />} onClick={add}>
        Add field
      </AddRowButton>
    </SettingsSection>
  );
}
