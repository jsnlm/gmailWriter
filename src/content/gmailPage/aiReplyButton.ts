import { SELECTORS } from "./selectors";
import { createAiButton } from "./aiButtonStyle";

// Our "Draft with AI" button, placed next to each of Gmail's Reply buttons in
// the open thread.

const CLASS_NAME = "gmail-drafter-btn";

/** Adds the button next to any Reply button that doesn't have one yet. */
export function inject(onClick: () => void): void {
  document.querySelectorAll<HTMLElement>(SELECTORS.replyButtonRow).forEach((row) => {
    if (row.nextElementSibling?.classList.contains(CLASS_NAME)) return;
    row.insertAdjacentElement("afterend", createAiButton(CLASS_NAME, "Draft with AI", "Draft a reply with AI (Alt+R)", onClick));
  });
}
