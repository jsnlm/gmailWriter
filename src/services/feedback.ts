// Feedback goes to the project's GitHub issues: a new issue opens pre-filled
// with a short template and the versions that help reproduce problems.
// Nothing is posted until the user submits it, and only versions go in: no
// email content, settings or keys.
//
// This lives in services (not shared.tsx) because the service worker uses it
// too, for the uninstall page, and shouldn't load React or MUI.

const NEW_ISSUE_URL = "https://github.com/jsnlm/gmailWriter/issues/new";

function versions(): string[] {
  const chromeVersion = navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? "unknown";
  return [
    "---",
    `Extension version: ${chrome.runtime.getManifest().version}`,
    `Chrome version: ${chromeVersion}`,
  ];
}

function newIssueUrl(title: string, lines: string[]): string {
  const body = [...lines, ...versions()].join("\n");
  return `${NEW_ISSUE_URL}?${new URLSearchParams({ title, body })}`;
}

/** "Send feedback": a problem, an idea or a feature request. */
export function feedbackUrl(): string {
  return newIssueUrl("", [
    "<!-- A problem, an idea or a feature request: all welcome. -->",
    "",
    "**What's on your mind?**",
    "",
    "",
    "**If something went wrong, what were you doing when it happened?**",
    "",
    "",
  ]);
}

/** Opened by Chrome when the user uninstalls the extension. */
export function uninstallFeedbackUrl(): string {
  return newIssueUrl("Uninstall feedback", [
    "Sorry to see you go! A sentence or two on why helps make it better.",
    "",
    "**Why did you uninstall?**",
    "",
    "",
    "**What would have made you keep it?**",
    "",
    "",
  ]);
}
