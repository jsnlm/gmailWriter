import React, { useState, useEffect, useCallback } from "react";
import type { ThreadData, SyncSettings, LocalSettings } from "../../types";
import { CategorySelector } from "./CategorySelector";
import { ToneSelector } from "./ToneSelector";
import { DraftViewer } from "./DraftViewer";
import { insertIntoCompose } from "../../content/compose";

type View = "loading-categories" | "select-category" | "loading-draft" | "view-drafts" | "error";

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

  // Load categories on mount
  useEffect(() => {
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

  const generateDraft = useCallback(async () => {
    const category = selectedCategory ?? "";
    const instructions = customInstructions;

    setIsGeneratingDraft(true);
    if (drafts.length === 0) setView("loading-draft");

    chrome.runtime.sendMessage(
      { type: "GET_DRAFT", thread, category, tone, customInstructions: instructions, settings },
      (response: { draft?: string; error?: string }) => {
        setIsGeneratingDraft(false);
        if (chrome.runtime.lastError || response?.error) {
          setError(response?.error ?? chrome.runtime.lastError?.message ?? "Failed to generate draft");
          setView("error");
        } else if (response.draft) {
          setDrafts((prev) => [...prev, response.draft!]);
          setView("view-drafts");
        }
      }
    );
  }, [selectedCategory, customInstructions, tone, thread, settings, drafts.length]);

  const handleSubmit = () => {
    if (!selectedCategory && !customInstructions.trim()) return;
    setDrafts([]);
    generateDraft();
  };

  const handleInsert = (text: string) => {
    const success = insertIntoCompose(text);
    if (!success) {
      alert("Could not find Gmail's compose area. Please click Reply in the email thread first, then try inserting again.");
    }
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="sidebar-icon">✦</span>
          <span>AI Drafter</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            title="Settings"
            onClick={() => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" })}
          >
            ⚙
          </button>
          <button className="icon-btn" title="Close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* Thread subject */}
      <div className="thread-info">
        <span className="thread-subject" title={thread.subject}>{thread.subject}</span>
      </div>

      {/* Body */}
      <div className="sidebar-body">
        {view === "loading-categories" && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Analyzing email thread...</p>
          </div>
        )}

        {view === "error" && (
          <div className="error-state">
            <p className="error-message">{error}</p>
            {error?.includes("API key") && (
              <button
                className="btn btn-primary"
                onClick={() => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" })}
              >
                Open Settings
              </button>
            )}
          </div>
        )}

        {(view === "select-category" || view === "loading-draft") && (
          <>
            <CategorySelector
              categories={categories}
              selected={selectedCategory}
              customInstructions={customInstructions}
              onSelect={setSelectedCategory}
              onCustomInstructions={setCustomInstructions}
            />
            <ToneSelector tone={tone} onChange={setTone} />
            <button
              className="btn btn-primary submit-btn"
              onClick={handleSubmit}
              disabled={view === "loading-draft" || (!selectedCategory && !customInstructions.trim())}
            >
              {view === "loading-draft" ? (
                <><span className="spinner-sm" /> Drafting...</>
              ) : (
                "Generate Draft"
              )}
            </button>
          </>
        )}

        {view === "view-drafts" && (
          <>
            <button
              className="btn btn-ghost back-btn"
              onClick={() => {
                setDrafts([]);
                setView("select-category");
              }}
            >
              ← Back to categories
            </button>
            <DraftViewer
              drafts={drafts}
              isGenerating={isGeneratingDraft}
              onGenerateAnother={generateDraft}
              onInsert={handleInsert}
            />
          </>
        )}
      </div>
    </div>
  );
}
