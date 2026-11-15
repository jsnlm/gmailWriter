import type { Draft } from "../types";

// Inserts drafts into Gmail's compose areas. There are two kinds:
// - reply boxes, inline inside the open thread;
// - new-message windows (the pop-up that Gmail's Compose button opens), which
//   have a visible Subject field.
// Each insert targets the right kind, so a draft never lands in the wrong one
// when both are open.

const OPEN_WINDOW_TIMEOUT_MS = 3000;
const POLL_MS = 100;

const BODY_SELECTORS = [
  "div[aria-label='Message Body'][contenteditable='true']",
  ".Am.Al.editable[contenteditable='true']",
  "[contenteditable='true'][g_editable='true']",
];

function findBody(root: ParentNode): HTMLElement | null {
  for (const selector of BODY_SELECTORS) {
    const el = root.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

function isVisible(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

// ── Replies ───────────────────────────────────────────────────────────────────

/**
 * Inserts text into the reply box of the open thread.
 * Opens the reply area if it isn't already open.
 */
export function insertReply(text: string): boolean {
  const thread = document.querySelector<HTMLElement>("[role='main']") ?? document;
  const composeBody = findBody(thread);
  if (composeBody) {
    writeToCompose(composeBody, text);
    return true;
  }

  // Click Gmail's Reply button to open a compose area
  const replyBtn =
    document.querySelector<HTMLElement>("[data-tooltip='Reply']") ??
    document.querySelector<HTMLElement>(".ams[role='link']");
  if (!replyBtn) return false;

  replyBtn.click();
  // Give Gmail a moment to render the compose area
  setTimeout(() => {
    const body = findBody(thread);
    if (body) writeToCompose(body, text);
  }, 300);
  return true;
}

// ── New emails ────────────────────────────────────────────────────────────────

function getSubjectInput(win: ParentNode): HTMLInputElement | null {
  return win.querySelector<HTMLInputElement>("input[name='subjectbox']");
}

/** Open new-message windows, oldest first. Minimized windows are skipped. */
function getNewEmailWindows(): HTMLElement[] {
  const windows: HTMLElement[] = [];
  document.querySelectorAll<HTMLInputElement>("input[name='subjectbox']").forEach((subject) => {
    if (!isVisible(subject)) return; // reply boxes keep their subject hidden

    // The window is the dialog around the subject field; failing that, the
    // nearest ancestor that also holds a message body.
    let win: HTMLElement | null = subject.closest<HTMLElement>("[role='dialog']");
    if (!win) {
      win = subject.parentElement;
      while (win && win !== document.body && !findBody(win)) win = win.parentElement;
    }
    if (win && win !== document.body && findBody(win) && !windows.includes(win)) windows.push(win);
  });
  return windows;
}

function newestNewEmailWindow(): HTMLElement | undefined {
  const windows = getNewEmailWindows();
  return windows[windows.length - 1];
}

/**
 * Gmail's Compose button in the left menu. It has no ID or label, so we try
 * its older `gh` attribute, then the classes and layout it uses today.
 */
export function findComposeButton(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>("[gh='cm']") ??
    document.querySelector<HTMLElement>(".z0 > [role='button']") ??
    document.querySelector<HTMLElement>(".T-I.T-I-KE.L3[role='button']")
  );
}

/** Clicks Gmail's Compose button and waits for the new window to appear. */
async function openNewEmailWindow(): Promise<HTMLElement | null> {
  const composeBtn = findComposeButton();
  if (!composeBtn) return null;

  const before = new Set(getNewEmailWindows());
  composeBtn.click();

  const deadline = Date.now() + OPEN_WINDOW_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const opened = getNewEmailWindows().find((win) => !before.has(win));
    if (opened) return opened;
  }
  return null;
}

/** Recipients and subject from the newest open new-message window, if any. */
export function readNewEmailWindow(): { recipients: { name: string; email: string }[]; subject: string } | null {
  const win = newestNewEmailWindow();
  if (!win) return null;

  const recipients: { name: string; email: string }[] = [];
  win.querySelectorAll<HTMLElement>("[email]").forEach((el) => {
    const email = el.getAttribute("email") ?? "";
    if (!email || recipients.some((r) => r.email === email)) return;
    recipients.push({ name: el.getAttribute("name") ?? el.getAttribute("data-name") ?? email, email });
  });

  return { recipients, subject: getSubjectInput(win)?.value ?? "" };
}

/**
 * Inserts a draft into the newest open new-message window, opening one with
 * Gmail's Compose button if none is open. Fills the subject only if it's empty.
 */
export async function insertNewEmail(draft: Draft): Promise<boolean> {
  const win = newestNewEmailWindow() ?? (await openNewEmailWindow());
  if (!win) return false;

  const subject = getSubjectInput(win);
  if (subject && draft.subject && !subject.value.trim()) {
    subject.value = draft.subject;
    subject.dispatchEvent(new Event("input", { bubbles: true }));
    subject.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const body = findBody(win);
  if (!body) return false;
  writeToCompose(body, draft.body);
  return true;
}

// ── Shared ────────────────────────────────────────────────────────────────────

function textToHtml(text: string): string {
  // Split on double newlines for paragraphs, single newlines for <br>
  return text
    .split(/\n\n+/)
    .map((para) =>
      `<p>${para
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>")}</p>`
    )
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeToCompose(el: HTMLElement, text: string): void {
  el.focus();
  const html = textToHtml(text);
  // If the compose area is empty, replace it entirely
  if (el.innerText.trim() === "") {
    el.innerHTML = html;
  } else {
    // Prepend before any existing content (e.g. quoted reply or signature)
    el.insertAdjacentHTML("afterbegin", html);
  }
  // Notify Gmail that content changed
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  // Scroll compose into view
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
