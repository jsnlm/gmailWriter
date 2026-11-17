import { SELECTORS } from "./selectors";
import { createAiButton } from "./aiButton";
import { findComposeButton } from "./composeWindows";

// Our "Compose with AI" button: a square, icon-only button right beside
// Gmail's Compose button, like the attached half of a split button. Styled in
// gmailPage.scss; the only thing it relies on from Gmail is where Compose is.

const CLASS_NAME = "gmail-drafter-compose-btn";
const HIDDEN_CLASS = "gmail-drafter-hidden";

/** Adds the button beside Gmail's Compose button if it isn't there. */
export function inject(onClick: () => void): void {
  const composeBtn = findComposeButton();
  if (!composeBtn) return;

  let btn = composeBtn.nextElementSibling as HTMLElement | null;
  if (!btn?.classList.contains(CLASS_NAME)) {
    btn = createAiButton({
      className: CLASS_NAME,
      title: "Compose with AI (Alt+R)",
      onClick,
    });
    composeBtn.insertAdjacentElement("afterend", btn);
  }

  // When the left menu is collapsed, its Compose row shrinks to nothing and
  // there's no room beside Compose; hide ours (Alt+R still works).
  const row = composeBtn.closest<HTMLElement>(SELECTORS.composeButtonRow);
  btn.classList.toggle(HIDDEN_CLASS, !!row && row.getBoundingClientRect().width < 100);
}
