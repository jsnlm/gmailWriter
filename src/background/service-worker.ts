import * as llm from "../services/llm";
import type { ThreadData, SyncSettings, LocalSettings } from "../types";

type AllSettings = SyncSettings & LocalSettings;

// Forward keyboard shortcut to the active Gmail tab
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-sidebar") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(
  (
    message: {
      type: string;
      thread?: ThreadData;
      settings?: AllSettings;
      category?: string;
      tone?: string;
      customInstructions?: string;
      previousDrafts?: string[];
    },
    _sender,
    sendResponse
  ) => {
    if (message.type === "GET_CATEGORIES") {
      const { thread, settings } = message;
      if (!thread || !settings) {
        sendResponse({ error: "Missing thread or settings" });
        return true;
      }
      llm.generateCategories(thread, settings)
        .then((categories) => sendResponse({ categories }))
        .catch((err: Error) => sendResponse({ error: err.message }));
      return true; // keep message channel open for async response
    }

    if (message.type === "GET_DRAFT") {
      const { thread, settings, category, tone, customInstructions, previousDrafts } = message;
      if (!thread || !settings) {
        sendResponse({ error: "Missing thread or settings" });
        return true;
      }
      llm.generateDraft(
        thread,
        category ?? "",
        tone ?? "Casual",
        customInstructions ?? "",
        settings,
        previousDrafts ?? []
      )
        .then((draft) => sendResponse({ draft }))
        .catch((err: Error) => sendResponse({ error: err.message }));
      return true;
    }

    if (message.type === "OPEN_OPTIONS") {
      chrome.runtime.openOptionsPage();
      return false;
    }

    return false;
  }
);
