import React from "react";
import { Sidebar, type SidebarMode, type SavedPrompt } from "../components/Sidebar/Sidebar";
import { gmailPage } from "./gmailPage/gmailPage";
import { SidebarHost } from "./SidebarHost";
import * as storage from "../services/storage";
import { DEFAULT_TONE } from "../services/tone";
import type { Draft } from "../types";

// Content script entry point: wires Gmail's page (gmailPage), our sidebar
// panel (SidebarHost) and the sidebar UI together, and decides when to open
// the sidebar and in which mode.

const host = new SidebarHost({
  onResize: (width) => gmailPage.reserveRightEdge(width),
  onResizeEnd: (width) => storage.saveLocalSettings({ sidebarWidth: width }),
});

let currentModeKind: SidebarMode["kind"] | null = null;

// The thread a reply sidebar belongs to: its ID in the URL (to tell which way
// the user navigated) and on screen (to tell when the next thread has loaded).
let threadIdInUrl: string | null = null;
let threadIdOnScreen: string | null = null;

// Bumped on every open and close, so a slow open that's been overtaken by a
// newer one (or by closing) gives up instead of showing stale content.
let openGeneration = 0;

// What the user typed and chose, kept across closing, navigating and switching
// between reply and compose. Lives for the life of the tab.
let savedPrompt: SavedPrompt = { instructions: "", recipientNote: "", tone: DEFAULT_TONE };

/**
 * Opens the sidebar in `kind` mode. With `afterThreadChange`, first waits for
 * the next thread to replace the current one on screen (Gmail changes the URL
 * before it draws the thread).
 */
async function openSidebar(kind: SidebarMode["kind"], { afterThreadChange = false } = {}) {
  const generation = ++openGeneration;
  const isStale = () => generation !== openGeneration;

  let mode: SidebarMode;
  if (kind === "reply") {
    if (afterThreadChange && !(await gmailPage.waitForNewThread(threadIdOnScreen))) {
      if (!isStale()) closeSidebar();
      return;
    }
    const thread = await gmailPage.readThread();
    if (isStale()) return;
    if (!thread) {
      console.warn("[Gmail Drafter] Could not extract thread data. Are you viewing a thread?");
      return;
    }
    mode = { kind: "reply", thread, canReplyAll: gmailPage.canReplyAll() };
    threadIdInUrl = gmailPage.threadIdInUrl();
    threadIdOnScreen = gmailPage.threadIdOnScreen();
  } else {
    mode = { kind: "compose", currentUser: gmailPage.currentUser() };
  }

  const settings = await storage.getAllSettings();
  if (isStale()) return;
  const width = settings.sidebarWidth ?? storage.SIDEBAR_DEFAULT_WIDTH;

  const insert = (draft: Draft, { replyAll }: { replyAll: boolean }) =>
    mode.kind === "reply"
      ? gmailPage.insertReply(draft.body, { replyAll })
      : gmailPage.insertNewEmail(draft);

  host.show(
    <Sidebar
      // A new key resets the sidebar (drafts and all): per thread for replies,
      // once for compose. The prompt survives through savedPrompt.
      key={mode.kind === "reply" ? `reply:${threadIdOnScreen}` : "compose"}
      mode={mode}
      settings={settings}
      onClose={closeSidebar}
      onInsert={insert}
      getComposeDetails={() => gmailPage.readNewEmailWindow() ?? { recipients: [], subject: "" }}
      savedPrompt={savedPrompt}
      onPromptChange={(prompt) => { savedPrompt = prompt; }}
    />,
    width
  );
  gmailPage.reserveRightEdge(width);
  currentModeKind = kind;
}

function closeSidebar() {
  openGeneration++; // cancel any open still in progress
  host.hide();
  gmailPage.reserveRightEdge(0);
  currentModeKind = null;
}

/**
 * Opens or closes the sidebar. With no `kind` (the Alt+R shortcut), it drafts
 * a reply when a thread is open and a new email otherwise.
 */
function toggleSidebar(kind?: SidebarMode["kind"]) {
  if (host.isOpen && (!kind || kind === currentModeKind)) { closeSidebar(); return; }
  openSidebar(kind ?? (gmailPage.isViewingThread() ? "reply" : "compose"));
}

// What a reply sidebar does when Gmail's URL changes. A compose sidebar isn't
// tied to a page, so navigation never touches it.
gmailPage.onNavigate(() => {
  if (!host.isOpen || currentModeKind !== "reply") return;
  const urlId = gmailPage.threadIdInUrl();
  if (urlId === threadIdInUrl) return;                // same thread, e.g. ?compose=new: keep it
  if (!urlId) { closeSidebar(); return; }             // left the thread (inbox, label, search): close
  openSidebar("reply", { afterThreadChange: true });  // another thread: reload for it once it's loaded
});

// Alt+R, forwarded by the background service worker
chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === "TOGGLE_SIDEBAR") toggleSidebar();
});

gmailPage.addButtons({
  onDraftReply: () => toggleSidebar("reply"),
  onCompose: () => toggleSidebar("compose"),
});
