import type { EmailMessage, ThreadData } from "../types";

function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: raw, email: raw };
}

function getLoggedInUser(): { name: string; email: string } {
  // Try Google Account button aria-label: "Google Account: Name (email@gmail.com)"
  const accountBtn = document.querySelector<HTMLElement>(
    'a[aria-label*="Google Account"]'
  );
  if (accountBtn) {
    const label = accountBtn.getAttribute("aria-label") ?? "";
    const match = label.match(/Google Account:\s*(.+?)\s*\((.+?)\)/);
    if (match) return { name: match[1].trim(), email: match[2].trim() };
  }

  // Fallback: look for signed-in account in the account switcher
  const accountEl = document.querySelector<HTMLElement>(".gb_d.gb_Fa");
  if (accountEl) {
    const email = accountEl.getAttribute("data-email") ?? "";
    const name = accountEl.getAttribute("data-name") ?? email;
    if (email) return { name, email };
  }

  return { name: "Me", email: "" };
}

function parseMessageContainer(container: Element, index: number): EmailMessage | null {
  // Sender info
  const senderEl = container.querySelector<HTMLElement>(".gD");
  const fromEmail = senderEl?.getAttribute("email") ?? "";
  const fromName = senderEl?.getAttribute("name") ?? senderEl?.textContent?.trim() ?? fromEmail;

  // Recipients
  const recipientEls = container.querySelectorAll<HTMLElement>(".g2");
  const to = Array.from(recipientEls).map((el) => ({
    name: el.getAttribute("name") ?? el.textContent?.trim() ?? "",
    email: el.getAttribute("email") ?? el.textContent?.trim() ?? "",
  }));

  // Timestamp
  const timestampEl = container.querySelector<HTMLElement>(".g3");
  const timestamp = timestampEl?.getAttribute("title") ?? timestampEl?.textContent?.trim() ?? "";

  // Body — prefer the expanded/readable text
  const bodyEl =
    container.querySelector<HTMLElement>(".a3s.aiL") ??
    container.querySelector<HTMLElement>(".a3s");
  if (!bodyEl) return null;

  // Remove quoted/forwarded sections to keep body clean
  const clone = bodyEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".gmail_quote, .gmail_extra").forEach((el) => el.remove());
  const body = clone.innerText?.trim() ?? clone.textContent?.trim() ?? "";

  if (!body && !fromEmail) return null;

  return {
    id: `msg-${index}`,
    from: { name: fromName, email: fromEmail },
    to,
    timestamp,
    body,
  };
}

export function extractThreadData(): ThreadData | null {
  // Subject
  const subjectEl = document.querySelector<HTMLElement>(".hP");
  const subject = subjectEl?.textContent?.trim() ?? "(No subject)";

  // All email message containers
  const containers = document.querySelectorAll<HTMLElement>("[data-message-id]");
  if (containers.length === 0) return null;

  const messages: EmailMessage[] = [];
  containers.forEach((container, i) => {
    // Skip collapsed messages (only the header is visible)
    const isCollapsed = container.querySelector(".a3s") === null;
    if (isCollapsed) return;
    const msg = parseMessageContainer(container, i);
    if (msg) messages.push(msg);
  });

  if (messages.length === 0) return null;

  const currentUser = getLoggedInUser();

  return { subject, messages, currentUser };
}

export function isOnGmailThread(): boolean {
  return (
    window.location.hash.includes("#inbox/") ||
    window.location.hash.includes("#sent/") ||
    window.location.hash.includes("#all/") ||
    window.location.hash.includes("#search/") ||
    document.querySelector("[data-message-id]") !== null
  );
}
