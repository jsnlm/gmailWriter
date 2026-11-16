import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Divider,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";
import ReplyAllIcon from "@mui/icons-material/ReplyAll";
import type { Draft } from "../../types";

/**
 * Where a draft can go: a new email, a reply, or a reply when Gmail also
 * offers Reply all (the thread has several recipients).
 */
export type InsertTarget = "new-email" | "reply" | "reply-or-all";

interface DraftCardProps {
  draft: Draft;
  index: number;
  insertTarget: InsertTarget;
  onInsert: (draft: Draft, replyAll: boolean) => void;
}

function DraftCard({ draft, index, insertTarget, onInsert }: DraftCardProps) {
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
        {insertTarget === "new-email" ? (
          <Button variant="contained" fullWidth startIcon={<SendIcon />} onClick={() => onInsert({ subject, body: text }, false)}>
            Insert into Gmail
          </Button>
        ) : (
          // Mirrors Gmail's own Reply / Reply all row under a thread
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" fullWidth startIcon={<ReplyIcon />} onClick={() => onInsert({ subject, body: text }, false)}>
              Reply
            </Button>
            {insertTarget === "reply-or-all" && (
              <Button variant="outlined" fullWidth startIcon={<ReplyAllIcon />} onClick={() => onInsert({ subject, body: text }, true)}>
                Reply all
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface Props {
  drafts: Draft[];
  isGenerating: boolean;
  insertTarget: InsertTarget;
  onGenerateAnother: () => void;
  onInsert: (draft: Draft, replyAll: boolean) => void;
}

export function DraftViewer({ drafts, isGenerating, insertTarget, onGenerateAnother, onInsert }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {drafts.map((draft, i) => (
        <DraftCard key={i} draft={draft} index={i} insertTarget={insertTarget} onInsert={onInsert} />
      ))}
      {insertTarget !== "new-email" && (
        <Typography variant="caption" color="text.secondary">
          If a reply box is already open, the draft goes into it as it is.
        </Typography>
      )}

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
