import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, IconButton, CircularProgress,
  Alert, Button, Divider, Tooltip,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { ThreadData, SyncSettings, LocalSettings } from "../../types";
import { CategorySelector } from "./CategorySelector";
import { ToneSelector } from "./ToneSelector";
import { DraftViewer } from "./DraftViewer";
import { insertIntoCompose } from "../../content/compose";

type View = "loading-categories" | "select-category" | "error";

interface Props {
  thread: ThreadData;
  settings: SyncSettings & LocalSettings;
  onClose: () => void;
}

export function Sidebar({ thread, settings, onClose }: Props) {
  const [view, setView] = useState<View>("loading-categories");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [tone, setTone] = useState("Casual");
  const [drafts, setDrafts] = useState<string[]>([]);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.showSuggestedResponses) {
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

  const generateDraft = useCallback(() => {
    const category = selectedCategory ?? "";
    const instructions = customInstructions;

    setIsGeneratingDraft(true);

    chrome.runtime.sendMessage(
      { type: "GET_DRAFT", thread, category, tone, customInstructions: instructions, settings },
      (response: { draft?: string; error?: string }) => {
        setIsGeneratingDraft(false);
        if (chrome.runtime.lastError || response?.error) {
          setError(response?.error ?? chrome.runtime.lastError?.message ?? "Failed to generate draft");
          setView("error");
        } else if (response.draft) {
          setDrafts((prev) => [...prev, response.draft!]);
        }
      }
    );
  }, [selectedCategory, customInstructions, tone, thread, settings]);

  const handleSubmit = () => {
    if (!selectedCategory && !customInstructions.trim()) return;
    setDrafts([]);
    generateDraft();
  };

  const handleInsert = (text: string) => {
    const success = insertIntoCompose(text);
    if (!success) {
      alert("Could not find Gmail's compose area. Please click Reply in the email thread first.");
    }
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
          title={thread.subject}
          sx={{ display: "block", fontWeight: 500 }}
        >
          {thread.subject}
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
            <CategorySelector
              categories={categories}
              selected={selectedCategory}
              customInstructions={customInstructions}
              onSelect={setSelectedCategory}
              onCustomInstructions={setCustomInstructions}
              showSuggestions={settings.showSuggestedResponses}
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
                  onGenerateAnother={generateDraft}
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
