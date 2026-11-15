import { SELECTORS, queryFirst } from "./selectors";

// Makes room on Gmail's page for our sidebar, which covers the right edge.

const DOCK_STYLE_ID = "gmail-drafter-dock-style";

/**
 * Keeps `width` pixels on the right edge clear of Gmail's content, or gives
 * the space back when `width` is 0.
 */
export function reserveRightEdge(width: number): void {
  // The inbox or open thread: push it left
  const mainContent = queryFirst(document, SELECTORS.mainContent);
  if (mainContent) {
    mainContent.style.transition = "margin-right 0.25s ease";
    mainContent.style.marginRight = width > 0 ? `${width}px` : "0";
  }

  // New-message windows live in a dock pinned to the right edge of the screen.
  // A style rule (rather than an inline style) survives Gmail re-rendering it.
  let style = document.getElementById(DOCK_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = DOCK_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = width > 0
    ? `${SELECTORS.composeDock} { padding-right: ${width}px !important; box-sizing: border-box !important; }`
    : "";
}
