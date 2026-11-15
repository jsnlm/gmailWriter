import type { EmailMessage } from "../../types";
import { SELECTORS } from "./selectors";

// ── Gmail print view ──────────────────────────────────────────────────────────
// Gmail can render a whole thread as one plain HTML page: the page that
// "Print all" opens. The server builds it, so it contains every message in the
// thread, including ones collapsed on screen.
//
// We fetch it from the content script. The request goes to mail.google.com
// only and carries the user's existing Gmail login cookies, so no extra
// permissions are needed. We parse it with DOMParser, which doesn't run the
// page's scripts or load its images.
//
// The page format is undocumented and could change, so every failure returns
// null and the caller falls back to reading Gmail's on-screen DOM.

const FETCH_TIMEOUT_MS = 5000;

/** Gmail's internal thread ID; the print view accepts any message ID in the thread. */
function getLegacyThreadId(): string | null {
  return (
    document
      .querySelector(SELECTORS.legacyMessageId)
      ?.getAttribute("data-legacy-message-id") ?? null
  );
}

/** The `0` in /mail/u/0/; differs when several Google accounts are signed in. */
function getAccountIndex(): string {
  return location.pathname.match(/\/mail\/u\/(\d+)/)?.[1] ?? "0";
}

const BLOCK_TAGS = new Set([
  "P", "DIV", "BR", "TR", "LI", "UL", "OL", "TABLE", "BLOCKQUOTE",
  "H1", "H2", "H3", "H4", "H5", "H6", "HR", "PRE",
]);

/** Converts parsed HTML to text with line breaks (innerText needs a rendered page). */
function toText(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += (child.textContent ?? "").replace(/\s+/g, " ");
    } else if (child instanceof Element) {
      if (child.tagName === "BR") { out += "\n"; return; }
      if (child.tagName === "STYLE" || child.tagName === "SCRIPT") return;
      const isBlock = BLOCK_TAGS.has(child.tagName);
      if (isBlock) out += "\n";
      out += toText(child);
      if (isBlock) out += "\n";
    }
  });
  return out;
}

function cleanText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\[Quoted text hidden\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Parses `Name <a@b.com>, c@d.com, "Last, First" <e@f.com>` into addresses. */
function parseAddressList(raw: string): { name: string; email: string }[] {
  const matches = raw.matchAll(/(?:"?([^",<]*?)"?\s*<([^>]+)>)|([^\s,<>]+@[^\s,<>]+)/g);
  return Array.from(matches, (m) =>
    m[3]
      ? { name: m[3], email: m[3] }
      : { name: m[1].trim() || m[2].trim(), email: m[2].trim() }
  );
}

function parseSender(raw: string): { name: string; email: string } {
  const [addr] = parseAddressList(raw);
  return addr ?? { name: raw.trim(), email: "" };
}

function parseMessage(el: Element, index: number): EmailMessage | null {
  // Layout: row 1 is sender | date, then a recipients row, then the body.
  const rows = el instanceof HTMLTableElement ? Array.from(el.rows) : [];
  const header = rows[0];
  if (!header) return null;

  const cells = Array.from(header.cells);
  const from = parseSender(cells[0]?.textContent ?? "");
  const timestamp = cells.length > 1 ? cells[cells.length - 1].textContent?.trim() ?? "" : "";

  const recipientEl = el.querySelector(SELECTORS.printRecipient);
  const to = recipientEl
    ? toText(recipientEl)
        .split("\n")
        .filter((line) => /^\s*(to|cc):/i.test(line))
        .flatMap((line) => parseAddressList(line.replace(/^\s*(to|cc):/i, "")))
    : [];

  // Body: everything after the header, minus the recipients block
  const bodyRows = rows.slice(1).filter((row) => !row.querySelector(SELECTORS.printRecipient));
  const body = cleanText(bodyRows.map((row) => toText(row)).join("\n"));

  if (!body && !from.email) return null;
  return { id: `msg-${index}`, from, to, timestamp, body };
}

/**
 * Reads every message in the open thread from Gmail's print view.
 * Returns null if anything is off, so the caller can fall back to the DOM.
 */
export async function readMessages(): Promise<EmailMessage[] | null> {
  const threadId = getLegacyThreadId();
  if (!threadId) return null;

  const url = `/mail/u/${getAccountIndex()}/?view=pt&search=all&th=${encodeURIComponent(threadId)}`;
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok || new URL(res.url).hostname !== "mail.google.com") {
      console.warn(`[Gmail Drafter] Print view unavailable (status ${res.status}); reading the page instead.`);
      return null;
    }

    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const messages = Array.from(doc.querySelectorAll(SELECTORS.printMessage))
      .map((el, i) => parseMessage(el, i))
      .filter((m): m is EmailMessage => m !== null);

    if (messages.length === 0) {
      console.warn("[Gmail Drafter] Print view had no readable messages; reading the page instead.");
      return null;
    }
    return messages;
  } catch (err) {
    console.warn("[Gmail Drafter] Print view request failed; reading the page instead.", err);
    return null;
  }
}
