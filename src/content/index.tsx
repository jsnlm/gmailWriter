import React from "react";
import { createRoot } from "react-dom/client";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { extractThreadData } from "./gmail";
import { getAllSettings } from "../services/storage";
import type { ThreadData, SyncSettings, LocalSettings } from "../types";

const SIDEBAR_ID = "gmail-drafter-root";
const INJECT_BTN_CLASS = "gmail-drafter-btn";

// ── Styles ──────────────────────────────────────────────────────────────────

const STYLES = `
  :host {
    all: initial;
    position: fixed;
    top: 0;
    right: 0;
    width: 380px;
    height: 100vh;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .sidebar {
    width: 100%;
    height: 100%;
    background: #ffffff;
    border-left: 1px solid #e0e0e0;
    box-shadow: -4px 0 20px rgba(0,0,0,0.12);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #f8f9fa;
    flex-shrink: 0;
  }

  .sidebar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    color: #1a1a1a;
  }

  .sidebar-icon {
    color: #1a73e8;
    font-size: 18px;
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 6px;
    color: #5f6368;
    font-size: 16px;
    line-height: 1;
    transition: background 0.15s;
  }

  .icon-btn:hover {
    background: #e8eaed;
    color: #1a1a1a;
  }

  .thread-info {
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }

  .thread-subject {
    font-size: 13px;
    color: #444;
    font-weight: 500;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Loading */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    flex: 1;
    color: #5f6368;
    font-size: 14px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e8eaed;
    border-top-color: #1a73e8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner-sm {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.5);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    vertical-align: middle;
    margin-right: 6px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error */
  .error-state {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .error-message {
    color: #d93025;
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
  }

  /* Categories */
  .section-label {
    font-size: 13px;
    font-weight: 600;
    color: #3c4043;
    margin: 0 0 10px 0;
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .category-card {
    background: #f8f9fa;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    padding: 10px 14px;
    text-align: left;
    cursor: pointer;
    font-size: 13px;
    color: #3c4043;
    transition: all 0.15s;
    line-height: 1.4;
  }

  .category-card:hover {
    background: #e8f0fe;
    border-color: #1a73e8;
    color: #1a73e8;
  }

  .category-card.selected {
    background: #e8f0fe;
    border-color: #1a73e8;
    color: #1a73e8;
    font-weight: 500;
  }

  .custom-card {
    border-style: dashed;
    color: #5f6368;
  }

  .custom-card:hover, .custom-card.selected {
    color: #1a73e8;
    border-color: #1a73e8;
    border-style: dashed;
  }

  .custom-instructions {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1.5px solid #1a73e8;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    color: #1a1a1a;
    resize: vertical;
    outline: none;
    background: #fff;
  }

  /* Tone */
  .tone-selector {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tone-selector label {
    font-size: 13px;
    font-weight: 600;
    color: #3c4043;
    white-space: nowrap;
  }

  .tone-selector select {
    flex: 1;
    padding: 8px 10px;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    font-size: 13px;
    color: #3c4043;
    background: #fff;
    cursor: pointer;
    outline: none;
    font-family: inherit;
  }

  .tone-selector select:focus {
    border-color: #1a73e8;
  }

  /* Buttons */
  .btn {
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: all 0.15s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #1a73e8;
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1557b0;
  }

  .btn-secondary {
    background: #f8f9fa;
    color: #3c4043;
    border: 1.5px solid #e0e0e0;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e8eaed;
  }

  .btn-ghost {
    background: none;
    color: #5f6368;
    padding: 6px 0;
    font-size: 13px;
  }

  .btn-ghost:hover {
    color: #1a73e8;
  }

  .submit-btn {
    width: 100%;
  }

  .back-btn {
    align-self: flex-start;
  }

  /* Drafts */
  .draft-viewer {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .draft-card {
    border: 1.5px solid #e0e0e0;
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #fafafa;
  }

  .draft-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .draft-label {
    font-size: 12px;
    font-weight: 600;
    color: #5f6368;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .draft-textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    color: #1a1a1a;
    resize: vertical;
    background: #fff;
    line-height: 1.5;
    outline: none;
  }

  .draft-textarea:focus {
    border-color: #1a73e8;
  }

  .insert-btn {
    width: 100%;
  }

  .generate-more-btn {
    width: 100%;
  }
`;

// ── Sidebar host ─────────────────────────────────────────────────────────────

let sidebarHost: HTMLElement | null = null;
let reactRoot: ReturnType<typeof createRoot> | null = null;
let isSidebarOpen = false;
let currentThreadUrl = "";

function renderSidebar(thread: ThreadData, settings: SyncSettings & LocalSettings) {
  reactRoot!.render(
    // Keying on the URL forces a full React remount (resetting all state) when
    // the thread changes, so categories/drafts from the old thread are cleared.
    <SidebarWrapper
      key={window.location.href}
      thread={thread}
      settings={settings}
      onClose={closeSidebar}
    />
  );
}

async function openSidebar() {
  const thread = extractThreadData();
  if (!thread) {
    console.warn("[Gmail Drafter] Could not extract thread data. Are you viewing a thread?");
    return;
  }

  const settings = await getAllSettings();

  if (!sidebarHost) {
    sidebarHost = document.createElement("div");
    sidebarHost.id = SIDEBAR_ID;
    document.body.appendChild(sidebarHost);

    const shadow = sidebarHost.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = STYLES;
    shadow.appendChild(styleEl);

    const mountPoint = document.createElement("div");
    shadow.appendChild(mountPoint);
    reactRoot = createRoot(mountPoint);
  }

  currentThreadUrl = window.location.href;
  renderSidebar(thread, settings);
  sidebarHost.style.display = "block";
  isSidebarOpen = true;
  pushGmailContent(true);
}

function closeSidebar() {
  if (sidebarHost) sidebarHost.style.display = "none";
  isSidebarOpen = false;
  currentThreadUrl = "";
  pushGmailContent(false);
}

function toggleSidebar() {
  if (isSidebarOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// ── Detect Gmail SPA navigation and refresh the sidebar ──────────────────────

function onUrlChange() {
  const newUrl = window.location.href;
  if (newUrl === currentThreadUrl) return;
  // URL changed while sidebar is open — refresh with new thread data
  if (isSidebarOpen) {
    openSidebar();
  }
}

// Gmail uses both hash changes and pushState for navigation
window.addEventListener("hashchange", onUrlChange);

// Intercept pushState/replaceState so we also catch non-hash SPA navigations
const _pushState = history.pushState.bind(history);
history.pushState = (...args) => {
  _pushState(...args);
  onUrlChange();
};
const _replaceState = history.replaceState.bind(history);
history.replaceState = (...args) => {
  _replaceState(...args);
  onUrlChange();
};

// Push Gmail's main content area to make room for the sidebar
function pushGmailContent(open: boolean) {
  const mainContent = document.querySelector<HTMLElement>(".bkK") ?? // Gmail main content wrapper
    document.querySelector<HTMLElement>("[role='main']");
  if (mainContent) {
    mainContent.style.transition = "margin-right 0.25s ease";
    mainContent.style.marginRight = open ? "380px" : "0";
  }
}

// ── Wrapper that can handle re-renders ────────────────────────────────────────

interface WrapperProps {
  thread: ThreadData;
  settings: SyncSettings & LocalSettings;
  onClose: () => void;
}

function SidebarWrapper({ thread, settings, onClose }: WrapperProps) {
  return <Sidebar thread={thread} settings={settings} onClose={onClose} />;
}

// ── Message listener (from background SW) ────────────────────────────────────

chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === "TOGGLE_SIDEBAR") {
    toggleSidebar();
  }
});

// ── Inject "Draft with AI" button into Gmail reply action rows ───────────────
// .aJ5 is Gmail's per-email action bar containing Reply / Reply All / Forward.
// We inject adjacent to those buttons so the user never has to open the
// composer first.

function createDraftButton(): HTMLElement {
  const btn = document.createElement("button");
  btn.className = INJECT_BTN_CLASS;
  btn.title = "Draft with AI (Alt+R)";
  btn.textContent = "✦ Draft with AI";
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    background: #1a73e8;
    color: #fff;
    border: none;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    margin-left: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background 0.15s;
    vertical-align: middle;
  `;
  btn.addEventListener("mouseenter", () => { btn.style.background = "#1557b0"; });
  btn.addEventListener("mouseleave", () => { btn.style.background = "#1a73e8"; });
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSidebar();
  });
  return btn;
}

function injectDraftButton() {
  // Locate Gmail's "Reply" action buttons by their data-tooltip attribute.
  // These appear at the bottom of each expanded email in the thread view,
  // before the composer is ever opened. We insert our button right after each
  // one so it sits adjacent to Reply / Reply All / Forward.
  const replyBtns = document.querySelectorAll<HTMLElement>(
    '[data-tooltip="Reply"], [aria-label="Reply"]'
  );

  replyBtns.forEach((replyBtn) => {
    const container = replyBtn.parentElement;
    if (!container || container.querySelector(`.${INJECT_BTN_CLASS}`)) return;
    replyBtn.insertAdjacentElement("afterend", createDraftButton());
  });
}

// Use a MutationObserver to detect when Gmail renders action bars
const observer = new MutationObserver(() => {
  injectDraftButton();
});

observer.observe(document.body, { childList: true, subtree: true });
