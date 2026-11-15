import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, IconButton, CircularProgress,
  Alert, Button, Divider, Tooltip, TextField,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { ThreadData, Draft, ComposeContext, SyncSettings, LocalSettings } from "../../types";
import { CategorySelector } from "./CategorySelector";
import { ToneSelector } from "./ToneSelector";
import { DraftViewer } from "./DraftViewer";

type View = "loading-categories" | "select-category" | "error";

/** Replying to the open thread, or writing a new email from scratch. */
export type SidebarMode =
  | { kind: "reply"; thread: ThreadData }
  | { kind: "compose"; currentUser: { name: string; email: string } };

// The sidebar is plain UI: it never touches Gmail's page. Whoever renders it
// passes in how to insert a draft and what an open compose window holds.
interface Props {
  mode: SidebarMode;
  settings: SyncSettings & LocalSettings;
  onClose: () => void;
  /** Puts the draft into Gmail. Resolves false if there was nowhere to put it. */
  onInsert: (draft: Draft) => Promise<boolean>;
  /** Recipients and subject the user already entered in Gmail, for new emails. */
  getComposeDetails: () => { recipients: { name: string; email: string }[]; subject: string };
}

export function Sidebar({ mode, settings, onClose, onInsert, getComposeDetails }: Props) {
  const thread = mode.kind === "reply" ? mode.thread : null;
  const [view, setView] = useState<View>("loading-categories");
  const [recipientNote, setRecipientNote] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [tone, setTone] = useState("Casual");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Suggested responses need a thread to respond to
    if (!thread || !settings.showSuggestedResponses) {
      setView("select-category");
      return;
    }
    chrome.runtime.sendMessage(
      { type: "GET_CATEGORIES", thread, settings },
      (response: { categories?: string[]; error?: string }) => {
        if (chrome.runtime.lastError || response?.error) {
          setError(response?.error ?? chrome.runtime.lastError?.message ?? "Failed to load categories");
          setView("error");
        } else {
          setCategories(response.categories ?? []);
          setView("select-category");
        }
      }
    );
  }, []);

  const requestDraft = useCallback((previousDrafts: string[] = []) => {
    setIsGeneratingDraft(true);

    const onResponse = (draft: Draft | undefined, err: string | undefined) => {
      setIsGeneratingDraft(false);
      if (chrome.runtime.lastError || err) {
        setError(err ?? chrome.runtime.lastError?.message ?? "Failed to generate draft");
        setView("error");
      } else if (draft) {
        setDrafts((prev) => [...prev, draft]);
      }
    };

    if (mode.kind === "reply") {
      chrome.runtime.sendMessage(
        { type: "GET_DRAFT", thread: mode.thread, category: selectedCategory ?? "", tone, customInstructions, settings, previousDrafts },
        (response: { draft?: string; error?: string }) =>
          onResponse(response?.draft ? { body: response.draft } : undefined, response?.error)
      );
      return;
    }

    // Ask for the To/Subject now, in case the user filled them in after
    // opening the sidebar.
    const composeContext: ComposeContext = {
      currentUser: mode.currentUser,
      recipientNote,
      ...getComposeDetails(),
    };
    chrome.runtime.sendMessage(
      { type: "GET_NEW_EMAIL", composeContext, tone, customInstructions, settings, previousDrafts },
      (response: { draft?: Draft; error?: string }) => onResponse(response?.draft, response?.error)
    );
  }, [mode, selectedCategory, customInstructions, recipientNote, tone, settings, getComposeDetails]);

  const handleSubmit = () => {
    if (!selectedCategory && !customInstructions.trim()) return;
    setDrafts([]);
    requestDraft([]);
  };

  const handleInsert = async (draft: Draft) => {
    if (await onInsert(draft)) return;
    alert(mode.kind === "reply"
      ? "Could not find Gmail's compose area. Please click Reply in the email thread first."
      : "Could not open a new Gmail message. Please click Gmail's Compose button, then try Insert again.");
  };

  const canSubmit = !!(selectedCategory || customInstructions.trim());

  return (
    <Box sx={{
      width: "100%",
      height: "100%",
      bgcolor: "background.paper",
      borderLeft: 1,
      borderColor: "divider",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.10)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <Box sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "grey.50",
        flexShrink: 0,
      }}>
        <img src={chrome.runtime.getURL('public/icons/icon128.png')} alt="" style={{ width: 20, height: 20, marginRight: 8 }} />
        <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1, color: "text.primary" }}>
          AI Drafter
        </Typography>
        <Tooltip title="Settings">
          <IconButton size="small" onClick={() => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" })}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Thread subject chip */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          title={thread?.subject ?? "New email"}
          sx={{ display: "block", fontWeight: 500 }}
        >
          {thread?.subject ?? "New email"}
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>

        {view === "loading-categories" && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 2 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">Analyzing email thread…</Typography>
          </Box>
        )}

        {view === "error" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="error" variant="outlined">{error}</Alert>
            {error?.includes("API key") && (
              <Button variant="contained" onClick={() => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" })}>
                Open Settings
              </Button>
            )}
          </Box>
        )}

        {view === "select-category" && (
          <>
            {mode.kind === "compose" && (
              <TextField
                label="Who's it for? (optional)"
                placeholder="e.g. Sam, my landlord"
                fullWidth
                size="small"
                value={recipientNote}
                onChange={(e) => setRecipientNote(e.target.value)}
              />
            )}
            <CategorySelector
              categories={categories}
              selected={selectedCategory}
              customInstructions={customInstructions}
              onSelect={setSelectedCategory}
              onCustomInstructions={setCustomInstructions}
              showSuggestions={mode.kind === "reply" && settings.showSuggestedResponses}
              heading={mode.kind === "compose" ? "What do you want to write?" : undefined}
            />
            <Divider />
            <ToneSelector tone={tone} onChange={setTone} />
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              disabled={isGeneratingDraft || !canSubmit}
              startIcon={isGeneratingDraft ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            >
              {isGeneratingDraft ? "Drafting…" : "Generate Draft"}
            </Button>
            {drafts.length > 0 && (
              <>
                <Divider />
                <DraftViewer
                  drafts={drafts}
                  isGenerating={isGeneratingDraft}
                  onGenerateAnother={() => requestDraft(drafts.map((d) => d.body))}
                  onInsert={handleInsert}
                />
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
