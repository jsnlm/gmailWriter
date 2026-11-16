import type { Draft, ThreadData } from "../../types";
import * as openThread from "./openThread";
import * as composeWindows from "./composeWindows";
import * as sidebarSpace from "./sidebarSpace";
import * as urlChanges from "./urlChanges";
import { ButtonInjector, type ButtonHandlers } from "./buttonInjector";

// The only way into Gmail's page. Code outside this folder imports `gmailPage`
// from here and never touches Gmail's DOM or selectors itself.
//
// Files in this folder are named after the part of Gmail they deal with.
// Things we add to Gmail's page start with "ai".
//
// Shared
//   selectors.ts        every Gmail selector we rely on, documented
//
// Reading Gmail
//   openThread.ts       the open thread and the signed-in user
//   printView.ts        Gmail's print page, which has every message (used by openThread)
//
// Writing to Gmail
//   composeWindows.ts   reply boxes and new-message windows: reading them, inserting drafts
//
// Changing Gmail's page
//   sidebarSpace.ts     making room on the right edge for our sidebar
//   buttonInjector.ts   keeps our buttons on the page as Gmail redraws it
//   aiReplyButton.ts    our "Draft with AI" button, next to Reply
//   aiComposeButton.ts  our "Compose with AI" icon button, beside Compose
//   aiButtonStyle.ts    the look those two buttons share
//
// Watching Gmail
//   urlChanges.ts       noticing when Gmail changes the URL

type Person = { name: string; email: string };

export interface GmailPage {
  // ── Reading ───────────────────────────────────────────────────────────────
  /** The open thread with every message, or null if no thread is open. */
  readThread(): Promise<ThreadData | null>;
  /** True when a thread is open. */
  isViewingThread(): boolean;
  /** The thread ID in the URL, or null when the URL isn't a thread (inbox, search…). */
  threadIdInUrl(): string | null;
  /** An ID for the thread on screen, or null if none. */
  threadIdOnScreen(): string | null;
  /** Waits until a thread other than `previousId` is on screen; false if none appears in time. */
  waitForNewThread(previousId: string | null): Promise<boolean>;
  /** The signed-in user. */
  currentUser(): Person;
  /** True when Gmail offers "Reply all" on the open thread. */
  canReplyAll(): boolean;
  /** Recipients and subject of an open new-message window, if there is one. */
  readNewEmailWindow(): { recipients: Person[]; subject: string } | null;

  // ── Writing ───────────────────────────────────────────────────────────────
  /** Puts text in the open thread's reply box, opening a Reply or Reply all box if none is open. */
  insertReply(body: string, options?: { replyAll?: boolean }): Promise<boolean>;
  /** Puts a draft in a new-message window, opening one if needed. */
  insertNewEmail(draft: Draft): Promise<boolean>;

  // ── Page ──────────────────────────────────────────────────────────────────
  /** Keeps `width` pixels on the right edge clear for our sidebar; 0 gives it back. */
  reserveRightEdge(width: number): void;
  /** Adds our "Draft with AI" and "AI Compose" buttons, and keeps them there. */
  addButtons(handlers: ButtonHandlers): void;
  /** Calls `listener` whenever Gmail changes the URL. Returns an unsubscribe function. */
  onNavigate(listener: () => void): () => void;
}

export const gmailPage: GmailPage = {
  readThread: openThread.read,
  isViewingThread: openThread.isOpen,
  threadIdInUrl: openThread.idInUrl,
  threadIdOnScreen: openThread.idOnScreen,
  waitForNewThread: openThread.waitForNewThread,
  currentUser: openThread.currentUser,
  canReplyAll: composeWindows.canReplyAll,
  readNewEmailWindow: composeWindows.readNewEmailWindow,
  insertReply: composeWindows.insertReply,
  insertNewEmail: composeWindows.insertNewEmail,
  reserveRightEdge: sidebarSpace.reserveRightEdge,
  addButtons: (handlers) => new ButtonInjector(handlers).start(),
  onNavigate: urlChanges.onNavigate,
};
