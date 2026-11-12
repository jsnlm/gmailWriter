/**
 * Inserts text into Gmail's reply compose box.
 * Opens the reply area if it isn't already open.
 */
export function insert(text: string): boolean {
  // Try to find an already-open compose window body
  let composeBody = findComposeBody();

  if (!composeBody) {
    // Click Gmail's Reply button to open a compose area
    const replyBtn =
      document.querySelector<HTMLElement>("[data-tooltip='Reply']") ??
      document.querySelector<HTMLElement>(".ams[role='link']");
    if (replyBtn) {
      replyBtn.click();
      // Give Gmail a moment to render the compose area
      setTimeout(() => {
        const body = findComposeBody();
        if (body) writeToCompose(body, text);
      }, 300);
      return true;
    }
    return false;
  }

  writeToCompose(composeBody, text);
  return true;
}

function findComposeBody(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>("div[aria-label='Message Body'][contenteditable='true']") ??
    document.querySelector<HTMLElement>(".Am.Al.editable[contenteditable='true']") ??
    document.querySelector<HTMLElement>("[contenteditable='true'][g_editable='true']")
  );
}

function textToHtml(text: string): string {
  // Split on double newlines for paragraphs, single newlines for <br>
  return text
    .split(/\n\n+/)
    .map((para) =>
      `<p>${para
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>")}</p>`
    )
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeToCompose(el: HTMLElement, text: string): void {
  el.focus();
  const html = textToHtml(text);
  // If the compose area is empty, replace it entirely
  if (el.innerText.trim() === "") {
    el.innerHTML = html;
  } else {
    // Prepend before any existing content (e.g. quoted reply)
    el.insertAdjacentHTML("afterbegin", html);
  }
  // Notify Gmail that content changed
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  // Scroll compose into view
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
