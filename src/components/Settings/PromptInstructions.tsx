import React from "react";
import { TextField } from "@mui/material";
import { SettingsSection } from "./SettingsSection";

interface Props {
  instructions: string;
  onChange: (value: string) => void;
}

export function PromptInstructionsSection({ instructions, onChange }: Props) {
  return (
    <SettingsSection
      title="Writing Instructions"
      description="These instructions are added to every draft generation prompt. Use this to define rules for how responses should be written — e.g. avoiding AI-sounding patterns, preferred phrasing, things to always or never include."
    >
      <TextField
        label="Instructions"
        multiline
        rows={10}
        fullWidth
        value={instructions}
        onChange={(e) => onChange(e.target.value)}
        placeholder={[
          'Examples of what you can specify here:',
          '- Avoid phrases like "I hope this email finds you well" or "Please don\'t hesitate to reach out"',
          '- Never use bullet points in emails',
          '- Don\'t start sentences with "I"',
          '- Keep responses under 3 short paragraphs',
          '- Sound direct and confident, not overly polite',
        ].join('\n')}
      />
    </SettingsSection>
  );
}
