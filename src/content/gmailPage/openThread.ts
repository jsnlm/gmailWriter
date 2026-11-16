import type { EmailMessage, ThreadData } from "../../types";
import { SELECTORS, queryFirst, isVisible } from "./selectors";
import * as printView from "./printView";

// Reads the open thread and the signed-in user from Gmail's page.

type Person = { name: string; email: string };

export function currentUser(): Person {
  // Google Account button: "Google Account: Name (email@gmail.com)"
  const accountBtn = document.querySelector<HTMLElement>(SELECTORS.accountButton);
  if (accountBtn) {
    const label = accountBtn.getAttribute("aria-label") ?? "";
    const match = label.match(/Google Account:\s*(.+?)\s*\((.+?)\)/);
    if (match) return { name: match[1].trim(), email: match[2].trim() };
  }

  // Fallback: the signed-in account in the account switcher
  const accountEl = document.querySelector<HTMLElement>(SELECTORS.accountSwitcher);
  if (accountEl) {
    const email = accountEl.getAttribute("data-email") ?? "";
    const name = accountEl.getAttribute("data-name") ?? email;
    if (email) return { name, email };
  }

  return { name: "Me", email: "" };
}

// ── Which thread is open ──────────────────────────────────────────────────────
// The URL changes first, then Gmail draws the thread. The URL says which thread
// the user went to; the subject heading says which thread is on screen.

const THREAD_LOAD_TIMEOUT_MS = 5000;
const POLL_MS = 50;

/**
 * The thread ID in the URL, e.g. "FMfcg…" in `#inbox/FMfcg…` or
 * `#label/Work/FMfcg…`, or null when the URL isn't a thread (inbox, search…).
 * Ignores `?compose=new` and similar, which Gmail adds without leaving the thread.
 */
export function idInUrl(): string | null {
  const path = location.hash.replace(/^#/, "").split("?")[0];
  const last = path.split("/").pop() ?? "";
  return /^[A-Za-z0-9_-]{16,}$/.test(last) ? last : null;
}

/** An ID for the thread on screen (from its subject heading), or null if none. */
export function idOnScreen(): string | null {
  const subject = document.querySelector<HTMLElement>(`${SELECTORS.main} ${SELECTORS.threadSubject}`);
  if (!subject || !isVisible(subject)) return null;
  return subject.getAttribute("data-legacy-thread-id") ?? subject.textContent?.trim() ?? null;
}

/**
 * Waits until a thread other than `previousId` is on screen. Resolves false
 * if none appears in time.
 */
export async function waitForNewThread(previousId: string | null): Promise<boolean> {
  const deadline = Date.now() + THREAD_LOAD_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const id = idOnScreen();
    if (id && id !== previousId && document.querySelector(SELECTORS.threadItem)) return true;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return false;
}

/** True when a thread is open (its subject heading is on screen). */
export function isOpen(): boolean {
  const subject = document.querySelector<HTMLElement>(`${SELECTORS.main} ${SELECTORS.threadSubject}`);
  return subject !== null && isVisible(subject);
}

/**
 * Reads the open thread. Uses Gmail's print view, which includes collapsed
 * messages, and falls back to the on-screen page if that fails.
 */
export async function read(): Promise<ThreadData | null> {
  const fromPage = readFromPage();
  if (!fromPage) return null;

  const messages = await printView.readMessages();
  if (messages) return { ...fromPage, messages };
  return fromPage;
}

// ── Reading the on-screen page ────────────────────────────────────────────────
// Gmail only renders a message's body (and its `data-message-id` container)
// once the message is expanded. Collapsed messages are bare list items with
// just the sender. read() gets their text from the print view instead; this is
// the fallback.

function readFromPage(): ThreadData | null {
  const subject = document.querySelector<HTMLElement>(SELECTORS.threadSubject)?.textContent?.trim() ?? "(No subject)";

  // Every message in the thread, in order, whether or not it's expanded
  const items = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.threadItem));
  if (items.length === 0) return null;

  const messages: EmailMessage[] = [];
  items.forEach((item, i) => {
    const container = item.querySelector<HTMLElement>(SELECTORS.messageContainer);
    const isLoaded = item.querySelector(SELECTORS.loadedMessage) !== null;
    const msg = container && isLoaded ? parseMessage(container, i) : parseCollapsedItem(item, i);
    if (msg) messages.push(msg);
  });

  if (messages.length === 0) return null;
  return { subject, messages, currentUser: currentUser() };
}

function parseMessage(container: Element, index: number): EmailMessage | null {
  const senderEl = container.querySelector<HTMLElement>(SELECTORS.messageSender);
  const fromEmail = senderEl?.getAttribute("email") ?? "";
  const fromName = senderEl?.getAttribute("name") ?? senderEl?.textContent?.trim() ?? fromEmail;

  const to = Array.from(container.querySelectorAll<HTMLElement>(SELECTORS.messageRecipient)).map((el) => ({
    name: el.getAttribute("name") ?? el.textContent?.trim() ?? "",
    email: el.getAttribute("email") ?? el.textContent?.trim() ?? "",
  }));

  const timestampEl = container.querySelector<HTMLElement>(SELECTORS.messageTimestamp);
  const timestamp = timestampEl?.getAttribute("title") ?? timestampEl?.textContent?.trim() ?? "";

  const bodyEl = queryFirst(container, SELECTORS.messageBody);
  if (!bodyEl) return null;

  // Remove quoted/forwarded sections to keep the body clean
  const clone = bodyEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(SELECTORS.quotedText).forEach((el) => el.remove());
  const body = clone.innerText?.trim() ?? clone.textContent?.trim() ?? "";

  if (!body && !fromEmail) return null;
  return { id: `msg-${index}`, from: { name: fromName, email: fromEmail }, to, timestamp, body };
}

/** Fallback for a collapsed message: keep at least the sender. */
function parseCollapsedItem(item: HTMLElement, index: number): EmailMessage | null {
  const senderEl = item.querySelector<HTMLElement>(SELECTORS.personWithEmail);
  if (!senderEl) return null;
  const email = senderEl.getAttribute("email") ?? "";
  return {
    id: `msg-${index}`,
    from: { name: senderEl.getAttribute("name") ?? email, email },
    to: [],
    timestamp: "",
    body: "[This message is collapsed, so its text couldn't be read]",
  };
}
