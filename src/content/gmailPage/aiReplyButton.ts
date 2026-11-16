import { SELECTORS } from "./selectors";
import { createAiButton } from "./aiButton";

// Our "Draft with AI" button, placed next to each of Gmail's Reply buttons in
// the open thread. Styled in gmailPage.scss.

const CLASS_NAME = "gmail-drafter-reply-btn";

/** Adds the button next to any Reply button that doesn't have one yet. */
export function inject(onClick: () => void): void {
  document.querySelectorAll<HTMLElement>(SELECTORS.replyButtonRow).forEach((row) => {
    if (row.nextElementSibling?.classList.contains(CLASS_NAME)) return;
    row.insertAdjacentElement(
      "afterend",
      createAiButton({ className: CLASS_NAME, label: "Draft with AI", title: "Draft a reply with AI (Alt+R)", onClick })
    );
  });
}
