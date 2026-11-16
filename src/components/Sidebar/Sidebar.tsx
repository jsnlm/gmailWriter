import React, { useState, useEffect, useCallback } from "react";
import {
  AppBar, Stack, Toolbar, Typography, IconButton, CircularProgress,
  Alert, Button, Divider, Tooltip, TextField,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { ThreadData, Draft, ComposeContext, SyncSettings, LocalSettings } from "../../types";
import { CategorySelector } from "./CategorySelector";
import { TonePicker } from "./TonePicker";
import type { Tone } from "../../services/tone";
import { DraftViewer } from "./DraftViewer";
import { SidebarRoot, ScrollBody, CenteredState } from "./Sidebar.styles";
import { AppLogo, ToolbarTitle } from "../shared";

type View = "loading-categories" | "select-category" | "error";

/** Replying to the open thread, or writing a new email from scratch. */
export type SidebarMode =
  | { kind: "reply"; thread: ThreadData; canReplyAll: boolean }
  | { kind: "compose"; currentUser: { name: string; email: string } };

/** What the user typed and chose, kept outside the sidebar so it survives closing, navigating and switching modes. */
export interface SavedPrompt {
  instructions: string;
  recipientNote: string;
  tone: Tone;
}

// The sidebar is plain UI: it never touches Gmail's page. Whoever renders it
// passes in how to insert a draft and what an open compose window holds.
interface Props {
  mode: SidebarMode;
  settings: SyncSettings & LocalSettings;
  onClose: () => void;
  /** Puts the draft into Gmail. Resolves false if there was nowhere to put it. */
  onInsert: (draft: Draft, options: { replyAll: boolean }) => Promise<boolean>;
  /** Recipients and subject the user already entered in Gmail, for new emails. */
  getComposeDetails: () => { recipients: { name: string; email: string }[]; subject: string };
  /** The prompt to start with, and where to report changes to it. */
  savedPrompt: SavedPrompt;
  onPromptChange: (prompt: SavedPrompt) => void;
}

export function Sidebar({ mode, settings, onClose, onInsert, getComposeDetails, savedPrompt, onPromptChange }: Props) {
  const thread = mode.kind === "reply" ? mode.thread : null;
  const [view, setView] = useState<View>("loading-categories");
  const [recipientNote, setRecipientNote] = useState(savedPrompt.recipientNote);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState(savedPrompt.instructions);
  const [tone, setTone] = useState<Tone>(savedPrompt.tone);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Typing updates the sidebar and reports the prompt in the same step, so it
  // survives the sidebar closing or switching modes.
  const changeInstructions = (instructions: string) => {
    setCustomInstructions(instructions);
    onPromptChange({ instructions, recipientNote, tone });
  };
  const changeRecipientNote = (note: string) => {
    setRecipientNote(note);
    onPromptChange({ instructions: customInstructions, recipientNote: note, tone });
  };
  const changeTone = (newTone: Tone) => {
    setTone(newTone);
    onPromptChange({ instructions: customInstructions, recipientNote, tone: newTone });
  };

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

  const handleInsert = async (draft: Draft, replyAll: boolean) => {
    if (await onInsert(draft, { replyAll })) return;
    alert(mode.kind === "reply"
      ? "Could not find Gmail's compose area. Please click Reply in the email thread first."
      : "Could not open a new Gmail message. Please click Gmail's Compose button, then try Insert again.");
  };

  const canSubmit = !!(selectedCategory || customInstructions.trim());

  return (
    <SidebarRoot square elevation={8}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar variant="dense">
          <AppLogo />
          <ToolbarTitle variant="subtitle1" fontWeight={600}>AI Drafter</ToolbarTitle>
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
        </Toolbar>
      </AppBar>
      <Divider />

      <Toolbar variant="dense">
        <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap title={thread?.subject ?? "New email"}>
          {thread?.subject ?? "New email"}
        </Typography>
      </Toolbar>
      <Divider />

      <ScrollBody spacing={2} useFlexGap>

        {view === "loading-categories" && (
          <CenteredState spacing={2}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">Analyzing email thread…</Typography>
          </CenteredState>
        )}

        {view === "error" && (
          <Stack spacing={2}>
            <Alert severity="error" variant="outlined">{error}</Alert>
            {error?.includes("API key") && (
              <Button variant="contained" onClick={() => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" })}>
                Open Settings
              </Button>
            )}
          </Stack>
        )}

        {view === "select-category" && (
          <>
            {mode.kind === "compose" && (
              <TextField
                label="Who's it for? (optional)"
                placeholder="e.g. Sam, my landlord"
                fullWidth
                value={recipientNote}
                onChange={(e) => changeRecipientNote(e.target.value)}
              />
            )}
            <CategorySelector
              categories={categories}
              selected={selectedCategory}
              customInstructions={customInstructions}
              onSelect={setSelectedCategory}
              onCustomInstructions={changeInstructions}
              showSuggestions={mode.kind === "reply" && settings.showSuggestedResponses}
              heading={mode.kind === "compose" ? "What do you want to write?" : undefined}
            />
            <Divider />
            <TonePicker tone={tone} onChange={changeTone} />
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
                  insertTarget={mode.kind === "compose" ? "new-email" : mode.canReplyAll ? "reply-or-all" : "reply"}
                />
              </>
            )}
          </>
        )}
      </ScrollBody>
    </SidebarRoot>
  );
}
