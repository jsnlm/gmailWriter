import type { Draft } from "../../types";
import { SELECTORS, queryFirst, isVisible } from "./selectors";

// Inserts drafts into Gmail's compose areas. There are two kinds:
// - reply boxes, inline inside the open thread;
// - new-message windows (the pop-up that Gmail's Compose button opens), which
//   have a visible Subject field.
// Each insert targets the right kind, so a draft never lands in the wrong one
// when both are open.

const OPEN_REPLY_TIMEOUT_MS = 3000;
const OPEN_WINDOW_TIMEOUT_MS = 3000;
const POLL_MS = 100;

type Person = { name: string; email: string };

// ── Replies ───────────────────────────────────────────────────────────────────

/** True when Gmail offers "Reply all" on the open thread (it has several recipients). */
export function canReplyAll(): boolean {
  return queryFirst(document, SELECTORS.replyAllButton) !== null;
}

/**
 * Inserts text into the reply box of the open thread. If no reply box is open,
 * opens one with Gmail's Reply or Reply all link first. A box that's already
 * open is used as it is.
 */
export async function insertReply(text: string, { replyAll = false } = {}): Promise<boolean> {
  const thread = document.querySelector<HTMLElement>(SELECTORS.main) ?? document;
  const openBody = queryFirst(thread, SELECTORS.composeBody);
  if (openBody) {
    writeToCompose(openBody, text);
    return true;
  }

  const replyAllBtn = replyAll ? queryFirst(document, SELECTORS.replyAllButton) : null;
  if (replyAll && !replyAllBtn) console.warn("[Gmail Drafter] No Reply all link found; using Reply.");
  const btn = replyAllBtn ?? queryFirst(document, SELECTORS.replyButton);
  if (!btn) return false;
  btn.click();

  // Wait for Gmail to render the reply box
  const deadline = Date.now() + OPEN_REPLY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const body = queryFirst(thread, SELECTORS.composeBody);
    if (body) {
      writeToCompose(body, text);
      return true;
    }
  }
  return false;
}

// ── New emails ────────────────────────────────────────────────────────────────

export function findComposeButton(): HTMLElement | null {
  return queryFirst(document, SELECTORS.composeButton);
}

/** Open new-message windows, oldest first. Minimized windows are skipped. */
function getNewEmailWindows(): HTMLElement[] {
  const windows: HTMLElement[] = [];
  document.querySelectorAll<HTMLInputElement>(SELECTORS.subjectInput).forEach((subject) => {
    if (!isVisible(subject)) return; // reply boxes keep their subject hidden

    // The window is the dialog around the subject field; failing that, the
    // nearest ancestor that also holds a message body.
    let win: HTMLElement | null = subject.closest<HTMLElement>(SELECTORS.composeWindow);
    if (!win) {
      win = subject.parentElement;
      while (win && win !== document.body && !queryFirst(win, SELECTORS.composeBody)) win = win.parentElement;
    }
    if (win && win !== document.body && queryFirst(win, SELECTORS.composeBody) && !windows.includes(win)) {
      windows.push(win);
    }
  });
  return windows;
}

function newestNewEmailWindow(): HTMLElement | undefined {
  const windows = getNewEmailWindows();
  return windows[windows.length - 1];
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
export function readNewEmailWindow(): { recipients: Person[]; subject: string } | null {
  const win = newestNewEmailWindow();
  if (!win) return null;

  const recipients: Person[] = [];
  win.querySelectorAll<HTMLElement>(SELECTORS.personWithEmail).forEach((el) => {
    const email = el.getAttribute("email") ?? "";
    if (!email || recipients.some((r) => r.email === email)) return;
    recipients.push({ name: el.getAttribute("name") ?? el.getAttribute("data-name") ?? email, email });
  });

  const subject = win.querySelector<HTMLInputElement>(SELECTORS.subjectInput)?.value ?? "";
  return { recipients, subject };
}

/**
 * Inserts a draft into the newest open new-message window, opening one with
 * Gmail's Compose button if none is open. Fills the subject only if it's empty.
 */
export async function insertNewEmail(draft: Draft): Promise<boolean> {
  const win = newestNewEmailWindow() ?? (await openNewEmailWindow());
  if (!win) return false;

  const subject = win.querySelector<HTMLInputElement>(SELECTORS.subjectInput);
  if (subject && draft.subject && !subject.value.trim()) {
    subject.value = draft.subject;
    subject.dispatchEvent(new Event("input", { bubbles: true }));
    subject.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const body = queryFirst(win, SELECTORS.composeBody);
  if (!body) return false;
  writeToCompose(body, draft.body);
  return true;
}

// ── Shared ────────────────────────────────────────────────────────────────────

function textToHtml(text: string): string {
  // Split on double newlines for paragraphs, single newlines for <br>
  return text
    .split(/\n\n+/)
    .map((para) => `<p>${para.split("\n").map(escapeHtml).join("<br>")}</p>`)
    .join("");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function writeToCompose(el: HTMLElement, text: string): void {
  el.focus();
  const html = textToHtml(text);
  if (el.innerText.trim() === "") {
    el.innerHTML = html;
  } else {
    // Prepend before any existing content (e.g. quoted reply or signature)
    el.insertAdjacentHTML("afterbegin", html);
  }
  // Notify Gmail that content changed
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
