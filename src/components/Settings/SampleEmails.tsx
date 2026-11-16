import React from "react";
import { Card, CardHeader, CardContent, Stack, InputBase, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { SettingsSection } from "./SettingsSection";
import { AddRowButton } from "./Settings.styles";

interface Props {
  emails: string[];
  onChange: (emails: string[]) => void;
}

export function SampleEmailsSection({ emails, onChange }: Props) {
  const update = (index: number, value: string) =>
    onChange(emails.map((e, i) => (i === index ? value : e)));

  const remove = (index: number) => onChange(emails.filter((_, i) => i !== index));

  const add = () => onChange([...emails, ""]);

  return (
    <SettingsSection
      title="Sample Emails"
      description="Paste emails you've written in the past. The AI will use these to match your writing style and voice when drafting replies."
    >
      <Stack spacing={2}>
        {emails.map((email, i) => (
          <Card key={i}>
            <CardHeader
              title={<Typography variant="overline">Email {i + 1}</Typography>}
              action={
                <IconButton onClick={() => remove(i)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            />
            <CardContent>
              <InputBase
                multiline
                minRows={6}
                fullWidth
                placeholder="Paste an email you wrote here..."
                value={email}
                onChange={(e) => update(i, e.target.value)}
                slotProps={{ input: { "aria-label": `Sample email ${i + 1}` } }}
              />
            </CardContent>
          </Card>
        ))}
      </Stack>

      <AddRowButton startIcon={<AddIcon />} onClick={add}>
        Add sample email
      </AddRowButton>
    </SettingsSection>
  );
}
