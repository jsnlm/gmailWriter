import React from "react";
import { createRoot } from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { Sidebar } from "../components/Sidebar/Sidebar";
import * as gmail from "./gmail";
import * as storage from "../services/storage";
import { gmailTheme } from "../theme";
import type { ThreadData, SyncSettings, LocalSettings } from "../types";

const SIDEBAR_ID = "gmail-drafter-root";
const INJECT_BTN_CLASS = "gmail-drafter-btn";
const SIDEBAR_MIN_WIDTH = 280;
const SIDEBAR_MAX_WIDTH = 700;

// ── Minimal host styles — MUI/emotion handles everything inside the shadow ────

const HOST_STYLES = `
  :host {
    all: initial;
    position: fixed;
    top: 0;
    right: 0;
    width: 380px;
    height: 100vh;
    z-index: 2147483647;
    font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }
  #resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
    z-index: 1;
    background: transparent;
  }
  #resize-handle:hover {
    background: rgba(26, 115, 232, 0.2);
  }
`;

// ── Sidebar host ──────────────────────────────────────────────────────────────

let sidebarHost: HTMLElement | null = null;
let reactRoot: ReturnType<typeof createRoot> | null = null;
let isSidebarOpen = false;
let currentThreadUrl = "";
let currentWidth = storage.SIDEBAR_DEFAULT_WIDTH;

function renderSidebar(thread: ThreadData, settings: SyncSettings & LocalSettings) {
  reactRoot!.render(
    <CacheProvider value={emotionCache!}>
      <ThemeProvider theme={gmailTheme}>
        <SidebarWrapper
          key={window.location.href}
          thread={thread}
          settings={settings}
          onClose={closeSidebar}
        />
      </ThemeProvider>
    </CacheProvider>
  );
}

let emotionCache: ReturnType<typeof createCache> | null = null;

async function openSidebar() {
  const thread = gmail.extractThreadData();
  if (!thread) {
    console.warn("[Gmail Drafter] Could not extract thread data. Are you viewing a thread?");
    return;
  }

  const settings = await storage.getAllSettings();
  currentWidth = settings.sidebarWidth ?? storage.SIDEBAR_DEFAULT_WIDTH;

  if (!sidebarHost) {
    sidebarHost = document.createElement("div");
    sidebarHost.id = SIDEBAR_ID;
    document.body.appendChild(sidebarHost);

    const shadow = sidebarHost.attachShadow({ mode: "open" });

    // Host styles
    const styleEl = document.createElement("style");
    styleEl.textContent = HOST_STYLES;
    shadow.appendChild(styleEl);

    // Resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.id = "resize-handle";
    shadow.appendChild(resizeHandle);

    resizeHandle.addEventListener("mousedown", (e: MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = currentWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, startWidth - (moveEvent.clientX - startX)));
        currentWidth = newWidth;
        sidebarHost!.style.width = `${newWidth}px`;
        const mainContent =
          document.querySelector<HTMLElement>(".bkK") ??
          document.querySelector<HTMLElement>("[role='main']");
        if (mainContent) mainContent.style.marginRight = `${newWidth}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        storage.saveLocalSettings({ sidebarWidth: currentWidth });
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    // Emotion injects MUI styles into the shadow root directly
    emotionCache = createCache({ key: "gd", container: shadow as unknown as HTMLElement, prepend: true });

    const mountPoint = document.createElement("div");
    mountPoint.style.cssText = "width:100%;height:100%;overflow:hidden;";
    shadow.appendChild(mountPoint);
    reactRoot = createRoot(mountPoint);
  }

  sidebarHost.style.width = `${currentWidth}px`;

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
  if (isSidebarOpen) { closeSidebar(); } else { openSidebar(); }
}

function pushGmailContent(open: boolean) {
  const mainContent =
    document.querySelector<HTMLElement>(".bkK") ??
    document.querySelector<HTMLElement>("[role='main']");
  if (mainContent) {
    mainContent.style.transition = "margin-right 0.25s ease";
    mainContent.style.marginRight = open ? `${currentWidth}px` : "0";
  }
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

interface WrapperProps {
  thread: ThreadData;
  settings: SyncSettings & LocalSettings;
  onClose: () => void;
}

function SidebarWrapper({ thread, settings, onClose }: WrapperProps) {
  return <Sidebar thread={thread} settings={settings} onClose={onClose} />;
}

// ── URL change detection ──────────────────────────────────────────────────────

function onUrlChange() {
  const newUrl = window.location.href;
  if (newUrl === currentThreadUrl) return;
  if (isSidebarOpen) openSidebar();
}

window.addEventListener("hashchange", onUrlChange);

const _pushState = history.pushState.bind(history);
history.pushState = (...args) => { _pushState(...args); onUrlChange(); };
const _replaceState = history.replaceState.bind(history);
history.replaceState = (...args) => { _replaceState(...args); onUrlChange(); };

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === "TOGGLE_SIDEBAR") toggleSidebar();
});

// ── Inject Material Design "Draft with AI" button ─────────────────────────────
// Styled to match Gmail's own Material Design buttons (filled, pill-shaped).

function createDraftButton(): HTMLElement {
  const btn = document.createElement("button");
  btn.className = INJECT_BTN_CLASS;
  btn.title = "Draft with AI (Alt+R)";

  // Icon + label
  btn.innerHTML = `
    <svg style="width:16px;height:16px;fill:currentColor;flex-shrink:0" viewBox="0 0 24 24">
      <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 19L13.09 14.74L12 21L10.91 14.74L5 19L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26Z"/>
    </svg>
    <span>Draft with AI</span>
  `;

  // Material Design filled button style matching Gmail's palette
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 36px;
    background: #1a73e8;
    color: #fff;
    border: none;
    border-radius: 18px;
    font-size: 14px;
    font-weight: 500;
    font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
    cursor: pointer;
    margin-left: 8px;
    letter-spacing: 0.01em;
    vertical-align: middle;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12);
    transition: background 0.15s, box-shadow 0.15s;
    outline: none;
    position: relative;
    overflow: hidden;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#1557b0";
    btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "#1a73e8";
    btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)";
  });
  btn.addEventListener("mousedown", () => { btn.style.background = "#1246a0"; });
  btn.addEventListener("mouseup", () => { btn.style.background = "#1557b0"; });
  btn.addEventListener("click", (e) => { e.stopPropagation(); toggleSidebar(); });

  return btn;
}

function injectDraftButton() {
  const containers = document.querySelectorAll<HTMLElement>(
    ':has( > [data-tooltip="Reply"]), :has( > [aria-label="Reply"])'
  );
  containers.forEach((container) => {
    if (container.nextElementSibling?.classList.contains(INJECT_BTN_CLASS)) return;
    container.insertAdjacentElement("afterend", createDraftButton());
  });
}

const observer = new MutationObserver(() => { injectDraftButton(); });
observer.observe(document.body, { childList: true, subtree: true });
