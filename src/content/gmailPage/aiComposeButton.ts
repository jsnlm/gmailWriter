import { SELECTORS } from "./selectors";
import { COLOR, COLOR_HOVER, COLOR_PRESSED } from "./aiButtonStyle";
import { findComposeButton } from "./composeWindows";

// Our "Compose with AI" button: a square, icon-only button right beside
// Gmail's Compose button, like the attached half of a split button. Compose
// itself is left untouched, and our button has a fixed size and look, so the
// only thing it relies on from Gmail is where Compose is.

const CLASS_NAME = "gmail-drafter-compose-btn";
const LABEL = "Compose with AI (Alt+R)";
const SIZE = 48; // Compose's height
const ICON_SIZE = 24;

/** Adds the button beside Gmail's Compose button if it isn't there. */
export function inject(onClick: () => void): void {
  const composeBtn = findComposeButton();
  if (!composeBtn) return;

  let btn = composeBtn.nextElementSibling as HTMLElement | null;
  if (!btn?.classList.contains(CLASS_NAME)) {
    btn = create(onClick);
    composeBtn.insertAdjacentElement("afterend", btn);
  }

  // When the left menu is collapsed, its Compose row shrinks to nothing and
  // there's no room beside Compose; hide ours (Alt+R still works).
  const row = composeBtn.closest<HTMLElement>(SELECTORS.composeButtonRow);
  const display = row && row.getBoundingClientRect().width < 100 ? "none" : "flex";
  if (btn.style.display !== display) btn.style.display = display;
}

function create(onClick: () => void): HTMLElement {
  const btn = document.createElement("button");
  btn.className = CLASS_NAME;
  btn.title = LABEL; // the browser's own tooltip
  btn.setAttribute("aria-label", LABEL);

  // Same icon as the sidebar's header
  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("public/icons/icon128.png");
  icon.alt = "";
  icon.style.cssText = `width:${ICON_SIZE}px;height:${ICON_SIZE}px;pointer-events:none;`;
  btn.appendChild(icon);

  btn.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
    width: ${SIZE}px;
    height: ${SIZE}px;
    margin-left: 8px;
    padding: 0;
    border: none;
    border-radius: 16px;
    background: ${COLOR};
    box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
    cursor: pointer;
    outline: none;
    transition: background 0.15s, box-shadow 0.08s linear;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.background = COLOR_HOVER;
    btn.style.boxShadow = "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = COLOR;
    btn.style.boxShadow = "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)";
  });
  btn.addEventListener("mousedown", () => { btn.style.background = COLOR_PRESSED; });
  btn.addEventListener("mouseup", () => { btn.style.background = COLOR_HOVER; });
  btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });

  return btn;
}
