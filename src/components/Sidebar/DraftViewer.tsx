import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Divider,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import SendIcon from "@mui/icons-material/Send";

interface DraftCardProps {
  draft: string;
  index: number;
  onInsert: (text: string) => void;
}

function DraftCard({ draft, index, onInsert }: DraftCardProps) {
  const [text, setText] = useState(draft);

  return (
    <Card>
      <Box sx={{ px: 2, py: 1, bgcolor: "grey.50", borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          Draft {index + 1}
        </Typography>
      </Box>
      <CardContent sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <TextField
          multiline
          rows={7}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
        />
        <Button
          variant="contained"
          fullWidth
          startIcon={<SendIcon />}
          onClick={() => onInsert(text)}
        >
          Insert into Gmail
        </Button>
      </CardContent>
    </Card>
  );
}

interface Props {
  drafts: string[];
  isGenerating: boolean;
  onGenerateAnother: () => void;
  onInsert: (text: string) => void;
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
