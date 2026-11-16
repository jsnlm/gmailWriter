import React, { useState } from "react";
import {
  Card, CardContent, CardHeader, Stack, Typography, TextField,
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
      <CardHeader title={<Typography variant="overline">Draft {index + 1}</Typography>} />
      <CardContent component={Stack} spacing={1.5}>
        {subject !== undefined && (
          <TextField
            label="Subject"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        )}
        <TextField
          multiline
          minRows={7}
          maxRows={20}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {insertTarget === "new-email" ? (
          <Button variant="contained" fullWidth startIcon={<SendIcon />} onClick={() => onInsert({ subject, body: text }, false)}>
            Insert into Gmail
          </Button>
        ) : (
          // Mirrors Gmail's own Reply / Reply all row under a thread
          <Stack direction="row" spacing={1}>
            <Button variant="contained" fullWidth startIcon={<ReplyIcon />} onClick={() => onInsert({ subject, body: text }, false)}>
              Reply
            </Button>
            {insertTarget === "reply-or-all" && (
              <Button variant="outlined" fullWidth startIcon={<ReplyAllIcon />} onClick={() => onInsert({ subject, body: text }, true)}>
                Reply all
              </Button>
            )}
          </Stack>
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
    <Stack spacing={2}>
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
    </Stack>
  );
}
