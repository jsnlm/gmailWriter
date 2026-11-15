import React from "react";
import { Sidebar, type SidebarMode } from "../components/Sidebar/Sidebar";
import { gmailPage } from "./gmailPage/gmailPage";
import { SidebarHost } from "./SidebarHost";
import * as storage from "../services/storage";
import type { Draft } from "../types";

// Content script entry point: wires Gmail's page (gmailPage), our sidebar
// panel (SidebarHost) and the sidebar UI together, and decides when to open
// the sidebar and in which mode.

const host = new SidebarHost({
  onResize: (width) => gmailPage.reserveRightEdge(width),
  onResizeEnd: (width) => storage.saveLocalSettings({ sidebarWidth: width }),
});

let currentModeKind: SidebarMode["kind"] | null = null;
let currentThreadUrl = "";

async function openSidebar(kind: SidebarMode["kind"]) {
  let mode: SidebarMode;
  if (kind === "reply") {
    const thread = await gmailPage.readThread();
    if (!thread) {
      console.warn("[Gmail Drafter] Could not extract thread data. Are you viewing a thread?");
      return;
    }
    mode = { kind: "reply", thread };
  } else {
    mode = { kind: "compose", currentUser: gmailPage.currentUser() };
  }

  const settings = await storage.getAllSettings();
  const width = settings.sidebarWidth ?? storage.SIDEBAR_DEFAULT_WIDTH;

  const insert = (draft: Draft) =>
    mode.kind === "reply"
      ? Promise.resolve(gmailPage.insertReply(draft.body))
      : gmailPage.insertNewEmail(draft);

  host.show(
    <Sidebar
      // A new key resets the sidebar: per thread for replies, once for compose
      key={mode.kind === "reply" ? window.location.href : "compose"}
      mode={mode}
      settings={settings}
      onClose={closeSidebar}
      onInsert={insert}
      getComposeDetails={() => gmailPage.readNewEmailWindow() ?? { recipients: [], subject: "" }}
    />,
    width
  );
  gmailPage.reserveRightEdge(width);
  currentModeKind = kind;
  currentThreadUrl = window.location.href;
}

function closeSidebar() {
  host.hide();
  gmailPage.reserveRightEdge(0);
  currentModeKind = null;
  currentThreadUrl = "";
}

/**
 * Opens or closes the sidebar. With no `kind` (the Alt+R shortcut), it drafts
 * a reply when a thread is open and a new email otherwise.
 */
function toggleSidebar(kind?: SidebarMode["kind"]) {
  if (host.isOpen && (!kind || kind === currentModeKind)) { closeSidebar(); return; }
  openSidebar(kind ?? (gmailPage.isViewingThread() ? "reply" : "compose"));
}

// Follow the user to the next thread; a new email isn't tied to a page
gmailPage.onNavigate(() => {
  if (window.location.href === currentThreadUrl) return;
  if (host.isOpen && currentModeKind === "reply" && gmailPage.isViewingThread()) openSidebar("reply");
});

// Alt+R, forwarded by the background service worker
chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === "TOGGLE_SIDEBAR") toggleSidebar();
});

gmailPage.addButtons({
  onDraftReply: () => toggleSidebar("reply"),
  onCompose: () => toggleSidebar("compose"),
});
