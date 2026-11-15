import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Divider,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import SendIcon from "@mui/icons-material/Send";
import type { Draft } from "../../types";

interface DraftCardProps {
  draft: Draft;
  index: number;
  onInsert: (draft: Draft) => void;
}

function DraftCard({ draft, index, onInsert }: DraftCardProps) {
  const [subject, setSubject] = useState(draft.subject);
  const [text, setText] = useState(draft.body);

  return (
    <Card>
      <Box sx={{ px: 2, py: 1, bgcolor: "grey.50", borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          Draft {index + 1}
        </Typography>
      </Box>
      <CardContent sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {subject !== undefined && (
          <TextField
            label="Subject"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          />
        )}
        <TextField
          multiline
          minRows={7}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": { fontSize: 13 },
            "& textarea": { resize: "vertical" },
          }}
        />
        <Button
          variant="contained"
          fullWidth
          startIcon={<SendIcon />}
          onClick={() => onInsert({ subject, body: text })}
        >
          Insert into Gmail
        </Button>
      </CardContent>
    </Card>
  );
}

interface Props {
  drafts: Draft[];
  isGenerating: boolean;
  onGenerateAnother: () => void;
  onInsert: (draft: Draft) => void;
}

export function DraftViewer({ drafts, isGenerating, onGenerateAnother, onInsert }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {drafts.map((draft, i) => (
        <DraftCard key={i} draft={draft} index={i} onInsert={onInsert} />
      ))}

      <Divider />

      <Button
        variant="outlined"
        fullWidth
        startIcon={<ReplayIcon />}
        onClick={onGenerateAnother}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating…" : "Generate another variation"}
      </Button>
    </Box>
  );
}
