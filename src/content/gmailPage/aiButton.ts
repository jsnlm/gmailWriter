// Creates the buttons the extension adds to Gmail's page. Their look lives in
// gmailPage.scss: every button gets the shared "gmail-drafter-ai-btn" class
// plus one of its own.

const ICON_PATH =
  "M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 19L13.09 14.74L12 21L10.91 14.74L5 19L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26Z";

export const BASE_CLASS = "gmail-drafter-ai-btn";

interface ButtonOptions {
  /** This button's own class, styled in gmailPage.scss. */
  className: string;
  /** Shown as the browser's tooltip and read out by screen readers. */
  title: string;
  onClick: () => void;
  /** Visible text next to the sparkle icon; omit for an icon-only button. */
  label?: string;
  /** An image to show instead of the sparkle icon. */
  imageUrl?: string;
}

export function createAiButton({ className, title, onClick, label, imageUrl }: ButtonOptions): HTMLElement {
  const btn = document.createElement("button");
  btn.className = `${BASE_CLASS} ${className}`;
  btn.title = title;
  btn.setAttribute("aria-label", title);

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    btn.appendChild(img);
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON_PATH}"/></svg>`;
  }
  if (label) {
    const span = document.createElement("span");
    span.textContent = label;
    btn.appendChild(span);
  }

  btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  return btn;
}
