import { SELECTORS } from "./selectors";
import { createAiButton } from "./aiButtonStyle";
import { findComposeButton } from "./composeWindows";

// Our "AI Compose" button, on its own line under Gmail's Compose button in the
// left menu.

const CLASS_NAME = "gmail-drafter-compose-btn";

/** Adds the button under Gmail's Compose button if it isn't there, and keeps it lined up. */
export function inject(onClick: () => void): void {
  const composeBtn = findComposeButton();
  if (!composeBtn) return;

  // Compose sits in its own row; our button goes on the next line
  const row = composeBtn.closest<HTMLElement>(SELECTORS.composeButtonRow) ?? composeBtn;
  let btn = row.nextElementSibling as HTMLElement | null;
  if (!btn?.classList.contains(CLASS_NAME)) {
    btn = createAiButton(CLASS_NAME, "AI Compose", "Write a new email with AI (Alt+R)", onClick);
    btn.style.height = "40px";
    btn.style.borderRadius = "20px";
    btn.style.margin = "0 0 8px 12px";
    btn.style.whiteSpace = "nowrap";
    row.insertAdjacentElement("afterend", btn);
  }
  fitUnderCompose(composeBtn, btn);
}

/**
 * Lines our button up under Compose. When the left menu is collapsed, Compose
 * shrinks to an icon, so ours drops its label too.
 */
function fitUnderCompose(composeBtn: HTMLElement, btn: HTMLElement): void {
  const collapsed = composeBtn.getBoundingClientRect().width < 100;
  const label = btn.querySelector("span");
  const display = collapsed ? "none" : "";
  if (label && label.style.display !== display) label.style.display = display;

  const parentLeft = btn.parentElement?.getBoundingClientRect().left ?? 0;
  const marginLeft = `${Math.max(0, Math.round(composeBtn.getBoundingClientRect().left - parentLeft))}px`;
  if (btn.style.marginLeft !== marginLeft) btn.style.marginLeft = marginLeft;
}
