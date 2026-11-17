// Creates the buttons the extension adds to Gmail's page. Their look lives in
// gmailPage.scss: every button gets the shared "gmail-drafter-ai-btn" class
// plus one of its own. Each shows the extension's icon, in the version made
// for a blue background (its sparkle is white).

export const BASE_CLASS = "gmail-drafter-ai-btn";

interface ButtonOptions {
  /** This button's own class, styled in gmailPage.scss. */
  className: string;
  /** Shown as the browser's tooltip and read out by screen readers. */
  title: string;
  onClick: () => void;
  /** Visible text next to the icon; omit for an icon-only button. */
  label?: string;
}

export function createAiButton({ className, title, onClick, label }: ButtonOptions): HTMLElement {
  const btn = document.createElement("button");
  btn.className = `${BASE_CLASS} ${className}`;
  btn.title = title;
  btn.setAttribute("aria-label", title);

  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("public/icons/icon-on-blue.svg");
  img.alt = "";
  btn.appendChild(img);

  if (label) {
    const span = document.createElement("span");
    span.textContent = label;
    btn.appendChild(span);
  }

  btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  return btn;
}
