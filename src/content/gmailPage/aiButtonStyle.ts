// The look of the buttons we add to Gmail's page. "Draft with AI" is a filled
// blue pill with a sparkle icon (createAiButton); the icon-only "Compose with
// AI" button uses the same blue (the exported colors).

const ICON_PATH =
  "M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 19L13.09 14.74L12 21L10.91 14.74L5 19L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26Z";

/** The extension's blue, used to set our buttons apart from Gmail's own. */
export const COLOR = "#1a73e8";
export const COLOR_HOVER = "#1557b0";
export const COLOR_PRESSED = "#1246a0";
const SHADOW = "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)";
const SHADOW_HOVER = "0 2px 6px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)";

/** A button with the sparkle icon and a label, and no look of its own. */
export function createButtonShell(
  className: string,
  label: string,
  title: string,
  onClick: () => void,
  iconSize = 16
): HTMLElement {
  const btn = document.createElement("button");
  btn.className = className;
  btn.title = title;
  btn.innerHTML = `
    <svg style="width:${iconSize}px;height:${iconSize}px;fill:currentColor;flex-shrink:0" viewBox="0 0 24 24">
      <path d="${ICON_PATH}"/>
    </svg>
    <span>${label}</span>
  `;
  btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  return btn;
}

/** A filled, pill-shaped blue button matching Gmail's Material Design buttons. */
export function createAiButton(className: string, label: string, title: string, onClick: () => void): HTMLElement {
  const btn = createButtonShell(className, label, title, onClick);

  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 36px;
    background: ${COLOR};
    color: #fff;
    border: none;
    border-radius: 18px;
    font-size: 14px;
    font-weight: 500;
    font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
    cursor: pointer;
    margin-left: 8px;
    letter-spacing: 0.01em;
    vertical-align: middle;
    box-shadow: ${SHADOW};
    transition: background 0.15s, box-shadow 0.15s;
    outline: none;
    position: relative;
    overflow: hidden;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.background = COLOR_HOVER;
    btn.style.boxShadow = SHADOW_HOVER;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = COLOR;
    btn.style.boxShadow = SHADOW;
  });
  btn.addEventListener("mousedown", () => { btn.style.background = COLOR_PRESSED; });
  btn.addEventListener("mouseup", () => { btn.style.background = COLOR_HOVER; });

  return btn;
}
