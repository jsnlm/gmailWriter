import { SELECTORS, queryFirst } from "./selectors";

// Makes room on Gmail's page for our sidebar, which covers the right edge.
// The rules live in gmailPage.scss; this sets the width they read.

const WIDTH_VARIABLE = "--gmail-drafter-sidebar-width";
const PUSHED_CLASS = "gmail-drafter-pushed";

/**
 * Keeps `width` pixels on the right edge clear of Gmail's content (the inbox
 * or open thread, and new-message windows), or gives the space back when
 * `width` is 0.
 */
export function reserveRightEdge(width: number): void {
  document.documentElement.style.setProperty(WIDTH_VARIABLE, `${width}px`);
  queryFirst(document, SELECTORS.mainContent)?.classList.add(PUSHED_CLASS);
}
