import * as aiReplyButton from "./aiReplyButton";
import * as aiComposeButton from "./aiComposeButton";

// Keeps our buttons on Gmail's page. Gmail redraws parts of its page all the
// time, which removes them, so one MutationObserver re-adds them after every
// change. One observer for both buttons, since each runs on every page change.

export interface ButtonHandlers {
  onDraftReply: () => void;
  onCompose: () => void;
}

export class ButtonInjector {
  private observer: MutationObserver | null = null;

  constructor(private readonly handlers: ButtonHandlers) {}

  start(): void {
    if (this.observer) return;
    this.observer = new MutationObserver(() => this.inject());
    this.observer.observe(document.body, { childList: true, subtree: true });
    this.inject();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private inject(): void {
    aiReplyButton.inject(this.handlers.onDraftReply);
    aiComposeButton.inject(this.handlers.onCompose);
  }
}
