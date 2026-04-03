import React from "react";
import {
  Box, Card, CardHeader, CardContent,
  TextField, IconButton, Button, Typography, Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

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
    <Box className="flex flex-col gap-6">
      <Box>
        <Typography variant="h6" className="font-semibold mb-1">Sample Emails</Typography>
        <Typography variant="body2" color="text.secondary">
          Paste emails you've written in the past. The AI will use these to match your writing style and voice when drafting replies.
        </Typography>
      </Box>

      <Divider />

      <Box className="flex flex-col gap-4">
        {emails.map((email, i) => (
          <Card key={i}>
            <CardHeader
              title={
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Email {i + 1}
                </Typography>
              }
              action={
                <IconButton onClick={() => remove(i)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
              sx={{ py: 1, px: 2, bgcolor: "grey.50", borderBottom: 1, borderColor: "divider" }}
            />
            <CardContent sx={{ p: 0 }}>
              <TextField
                multiline
                rows={6}
                fullWidth
                placeholder="Paste an email you wrote here..."
                value={email}
                onChange={(e) => update(i, e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 0, border: "none" },
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={add}
        sx={{ alignSelf: "flex-start", borderStyle: "dashed" }}
      >
        Add sample email
      </Button>
    </Box>
  );
}
