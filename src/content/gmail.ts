import type { EmailMessage, ThreadData } from "../types";
import * as printView from "./printView";

function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: raw, email: raw };
}

function getLoggedInUser(): { name: string; email: string } {
  // Try Google Account button aria-label: "Google Account: Name (email@gmail.com)"
  const accountBtn = document.querySelector<HTMLElement>(
    'a[aria-label*="Google Account"]'
  );
  if (accountBtn) {
    const label = accountBtn.getAttribute("aria-label") ?? "";
    const match = label.match(/Google Account:\s*(.+?)\s*\((.+?)\)/);
    if (match) return { name: match[1].trim(), email: match[2].trim() };
  }

  // Fallback: look for signed-in account in the account switcher
  const accountEl = document.querySelector<HTMLElement>(".gb_d.gb_Fa");
  if (accountEl) {
    const email = accountEl.getAttribute("data-email") ?? "";
    const name = accountEl.getAttribute("data-name") ?? email;
    if (email) return { name, email };
  }

  return { name: "Me", email: "" };
}

function parseMessageContainer(container: Element, index: number): EmailMessage | null {
  // Sender info
  const senderEl = container.querySelector<HTMLElement>(".gD");
  const fromEmail = senderEl?.getAttribute("email") ?? "";
  const fromName = senderEl?.getAttribute("name") ?? senderEl?.textContent?.trim() ?? fromEmail;

  // Recipients
  const recipientEls = container.querySelectorAll<HTMLElement>(".g2");
  const to = Array.from(recipientEls).map((el) => ({
    name: el.getAttribute("name") ?? el.textContent?.trim() ?? "",
    email: el.getAttribute("email") ?? el.textContent?.trim() ?? "",
  }));

  // Timestamp
  const timestampEl = container.querySelector<HTMLElement>(".g3");
  const timestamp = timestampEl?.getAttribute("title") ?? timestampEl?.textContent?.trim() ?? "";

  // Body — prefer the expanded/readable text
  const bodyEl =
    container.querySelector<HTMLElement>(".a3s.aiL") ??
    container.querySelector<HTMLElement>(".a3s");
  if (!bodyEl) return null;

  // Remove quoted/forwarded sections to keep body clean
  const clone = bodyEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".gmail_quote, .gmail_extra").forEach((el) => el.remove());
  const body = clone.innerText?.trim() ?? clone.textContent?.trim() ?? "";

  if (!body && !fromEmail) return null;

  return {
    id: `msg-${index}`,
    from: { name: fromName, email: fromEmail },
    to,
    timestamp,
    body,
  };
}

// ── Collapsed messages ────────────────────────────────────────────────────────
// Gmail only renders a message's body (and its `data-message-id` container)
// once the message is expanded. Collapsed messages are bare list items with
// just the sender. readThread() gets their text from the print view instead;
// this DOM reading is the fallback.

function getThreadItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="main"] [role="listitem"]'));
}

function isLoaded(item: HTMLElement): boolean {
  return item.querySelector("[data-message-id] .a3s") !== null;
}

/** Fallback for a collapsed message: keep at least the sender. */
function parseCollapsedItem(item: HTMLElement, index: number): EmailMessage | null {
  const senderEl = item.querySelector<HTMLElement>("[email]");
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

/**
 * Reads the open thread. Uses Gmail's print view, which includes collapsed
 * messages, and falls back to the on-screen DOM if that fails.
 */
export async function readThread(): Promise<ThreadData | null> {
  const fromPage = extractThreadData();
  if (!fromPage) return null;

  const messages = await printView.readMessages();
  if (messages) return { ...fromPage, messages };
  return fromPage;
}

function extractThreadData(): ThreadData | null {
  // Subject
  const subjectEl = document.querySelector<HTMLElement>(".hP");
  const subject = subjectEl?.textContent?.trim() ?? "(No subject)";

  // Every message in the thread, in order, whether or not it's expanded
  const items = getThreadItems();
  if (items.length === 0) return null;

  const messages: EmailMessage[] = [];
  items.forEach((item, i) => {
    const container = item.querySelector<HTMLElement>("[data-message-id]");
    const msg = container && isLoaded(item)
      ? parseMessageContainer(container, i)
      : parseCollapsedItem(item, i);
    if (msg) messages.push(msg);
  });

  if (messages.length === 0) return null;

  const currentUser = getLoggedInUser();

  return { subject, messages, currentUser };
}

export function isOnGmailThread(): boolean {
  return (
    window.location.hash.includes("#inbox/") ||
    window.location.hash.includes("#sent/") ||
    window.location.hash.includes("#all/") ||
    window.location.hash.includes("#search/") ||
    document.querySelector("[data-message-id]") !== null
  );
}
