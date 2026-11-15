import type { Draft } from "../../types";
import { SELECTORS, queryFirst, isVisible } from "./selectors";

// Inserts drafts into Gmail's compose areas. There are two kinds:
// - reply boxes, inline inside the open thread;
// - new-message windows (the pop-up that Gmail's Compose button opens), which
//   have a visible Subject field.
// Each insert targets the right kind, so a draft never lands in the wrong one
// when both are open.

const REPLY_OPEN_DELAY_MS = 300;
const OPEN_WINDOW_TIMEOUT_MS = 3000;
const POLL_MS = 100;

type Person = { name: string; email: string };

// ── Replies ───────────────────────────────────────────────────────────────────

/**
 * Inserts text into the reply box of the open thread.
 * Opens the reply area if it isn't already open.
 */
export function insertReply(text: string): boolean {
  const thread = document.querySelector<HTMLElement>(SELECTORS.main) ?? document;
  const composeBody = queryFirst(thread, SELECTORS.composeBody);
  if (composeBody) {
    writeToCompose(composeBody, text);
    return true;
  }

  const replyBtn = queryFirst(document, SELECTORS.replyButton);
  if (!replyBtn) return false;

  replyBtn.click();
  // Give Gmail a moment to render the reply box
  setTimeout(() => {
    const body = queryFirst(thread, SELECTORS.composeBody);
    if (body) writeToCompose(body, text);
  }, REPLY_OPEN_DELAY_MS);
  return true;
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
