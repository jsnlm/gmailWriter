// Every CSS selector we use on Gmail's page, in one place.
//
// Gmail doesn't publish its markup and changes class names without notice.
// When something stops working after a Gmail update, check here first. Lists
// are tried in order, so put the most reliable selector first and keep older
// ones as fallbacks.

export const SELECTORS = {
  // ── Page ──────────────────────────────────────────────────────────────────
  /** The main content area: the inbox list, or the open thread. */
  main: "[role='main']",
  /** What we push left to make room for the sidebar. */
  mainContent: [".bkK", "[role='main']"],
  /** Google Account button; its label reads "Google Account: Name (email)". */
  accountButton: "a[aria-label*='Google Account']",
  /** Older account switcher, with data-email/data-name attributes. */
  accountSwitcher: ".gb_d.gb_Fa",
  /** Any element carrying a person's address, e.g. sender names and recipient chips. */
  personWithEmail: "[email]",

  // ── Open thread ───────────────────────────────────────────────────────────
  /**
   * The thread's subject heading. Carries `data-legacy-thread-id`, which tells
   * one thread from another. Gone from the page when no thread is open.
   */
  threadSubject: ".hP",
  /** One per message in the thread, collapsed or expanded. */
  threadItem: "[role='main'] [role='listitem']",
  /** An expanded message. Collapsed ones don't have it. */
  messageContainer: "[data-message-id]",
  /** A message's body text, in readable then plain form. */
  messageBody: [".a3s.aiL", ".a3s"],
  /** A message whose body has loaded. */
  loadedMessage: "[data-message-id] .a3s",
  /** Inside a message: sender, recipients, timestamp (its title has the full date). */
  messageSender: ".gD",
  messageRecipient: ".g2",
  messageTimestamp: ".g3",
  /** Quoted history at the bottom of a message body. */
  quotedText: ".gmail_quote, .gmail_extra",
  /** Gmail's internal message ID, which the print view accepts as a thread ID. */
  legacyMessageId: "[role='main'] [data-legacy-message-id]",

  // ── Replying ──────────────────────────────────────────────────────────────
  replyButton: ["[data-tooltip='Reply']", ".ams[role='link']"],
  /**
   * The "Reply all" link under the last message. Only present when the thread
   * has several recipients. `jslog` 21577 is Gmail's ID for "reply all".
   */
  replyAllButton: [".ams[jslog^='21577;']", "[jslog^='21577;']", ".ams.bkI"],
  /** The element holding a Reply button; our "Draft with AI" goes after it. */
  replyButtonRow: ":has( > [data-tooltip='Reply']), :has( > [aria-label='Reply'])",

  // ── Composing ─────────────────────────────────────────────────────────────
  /** Gmail's Compose button. It has no ID or label, so: old attribute, then layout, then classes. */
  composeButton: ["[gh='cm']", ".z0 > [role='button']", ".T-I.T-I-KE.L3[role='button']"],
  /** The row Compose sits in; our "AI Compose" goes on the line after it. */
  composeButtonRow: ".z0",
  /** The editable body of a reply box or new-message window. */
  composeBody: [
    "div[aria-label='Message Body'][contenteditable='true']",
    ".Am.Al.editable[contenteditable='true']",
    "[contenteditable='true'][g_editable='true']",
  ],
  /** Subject field. Visible in new-message windows, hidden in reply boxes. */
  subjectInput: "input[name='subjectbox']",
  /** A new-message window. */
  composeWindow: "[role='dialog']",
  /** Holds the new-message windows, pinned to the screen's right edge. */
  composeDock: ".dw",

  // ── Print view (a separate page, see printView.ts) ────────────────────────
  printMessage: ".message",
  printRecipient: ".recipient",
} as const;

/** Returns the first element matching any of the selectors, tried in order. */
export function queryFirst<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selectors: string | readonly string[]
): T | null {
  for (const selector of typeof selectors === "string" ? [selectors] : selectors) {
    const el = root.querySelector<T>(selector);
    if (el) return el;
  }
  return null;
}

/** True if the element takes up space on screen. */
export function isVisible(el: Element): boolean {
  return el.getClientRects().length > 0;
}
