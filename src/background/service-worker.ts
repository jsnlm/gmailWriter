import * as llm from "../services/llm";
import { DEFAULT_TONE, type Tone } from "../services/tone";
import { uninstallFeedbackUrl } from "../services/feedback";
import type { ThreadData, ComposeContext, SyncSettings, LocalSettings } from "../types";

type AllSettings = SyncSettings & LocalSettings;

// When the user uninstalls, Chrome opens a pre-filled feedback issue. Set on
// every start so the versions in it stay current after updates.
chrome.runtime.setUninstallURL(uninstallFeedbackUrl());

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
      composeContext?: ComposeContext;
      settings?: AllSettings;
      category?: string;
      tone?: Tone;
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
        tone ?? DEFAULT_TONE,
        customInstructions ?? "",
        settings,
        previousDrafts ?? []
      )
        .then((draft) => sendResponse({ draft }))
        .catch((err: Error) => sendResponse({ error: err.message }));
      return true;
    }

    if (message.type === "GET_NEW_EMAIL") {
      const { composeContext, settings, tone, customInstructions, previousDrafts } = message;
      if (!composeContext || !settings) {
        sendResponse({ error: "Missing compose context or settings" });
        return true;
      }
      llm.generateNewEmail(
        composeContext,
        customInstructions ?? "",
        tone ?? DEFAULT_TONE,
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
