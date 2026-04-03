import type { ThreadData, SyncSettings, LocalSettings } from "../types";

type AllSettings = SyncSettings & LocalSettings;

function formatThread(thread: ThreadData): string {
  const lines: string[] = [`Subject: ${thread.subject}`, ""];
  for (const msg of thread.messages) {
    lines.push(`From: ${msg.from.name} <${msg.from.email}>`);
    if (msg.to.length > 0) {
      lines.push(`To: ${msg.to.map((r) => `${r.name} <${r.email}>`).join(", ")}`);
    }
    if (msg.timestamp) lines.push(`Date: ${msg.timestamp}`);
    lines.push("", msg.body, "", "---", "");
  }
  return lines.join("\n");
}

function formatPersonalInfo(settings: AllSettings): string {
  return settings.personalInfo
    .filter((entry) => entry.key && entry.value)
    .map((entry) => `${entry.key}: ${entry.value}`)
    .join("\n");
}

function formatSampleEmails(settings: AllSettings): string {
  return settings.sampleEmails
    .filter(Boolean)
    .map((email, i) => `--- Example ${i + 1} ---\n${email}`)
    .join("\n\n");
}

async function callClaude(
  settings: AllSettings,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const { apiKey, model } = settings.llmConfig;
  if (!apiKey) throw new Error("No API key configured. Please add your API key in Settings.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json() as { content: { type: string; text: string }[] };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

export async function generateCategories(
  thread: ThreadData,
  settings: AllSettings
): Promise<string[]> {
  const system = `You help users draft Gmail replies. Your job is to analyze an email thread and suggest specific, action-oriented response options tailored to the exact content of the thread.`;

  const user = `Here is the email thread:\n\n${formatThread(thread)}\n\nSuggest 3-5 specific, action-oriented response options for the most recent email. Each option should describe a concrete thing the user could respond with (e.g. "Accept the meeting on Tuesday", "Decline and suggest Thursday instead", "Ask for the project brief before committing"). Make them specific to this thread's content, not generic.\n\nReturn ONLY a JSON array of strings. No other text.\nExample: ["Accept the proposal", "Request more details", "Decline politely"]`;

  const raw = await callClaude(settings, system, user);
  try {
    // Strip any markdown code fences if present
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    // Fallback: extract quoted strings
    const matches = raw.match(/"([^"]+)"/g);
    if (matches) return matches.map((m) => m.replace(/"/g, ""));
  }
  return ["Reply to this email", "Ask for clarification", "Decline politely"];
}

export async function generateDraft(
  thread: ThreadData,
  category: string,
  tone: string,
  customInstructions: string,
  settings: AllSettings
): Promise<string> {
  const personalInfo = formatPersonalInfo(settings);
  const sampleEmails = formatSampleEmails(settings);

  const customRules = settings.promptInstructions?.trim()
    ? `\nAdditional instructions:\n${settings.promptInstructions.trim()}`
    : "";

  const system = `You are a writing assistant helping ${thread.currentUser.name || "the user"} draft email replies. Write in first person as if you are ${thread.currentUser.name || "the user"}.

${personalInfo ? `Information about the sender:\n${personalInfo}\n` : ""}${sampleEmails ? `\nWriting style examples (match this style and voice):\n${sampleEmails}\n` : ""}
Rules:
- Output ONLY the email body text. No subject line, no "Subject:", no greeting instructions, no meta-commentary.
- Match the ${tone.toLowerCase()} tone requested.
- Keep it natural and human-sounding.
- Sign off appropriately based on the tone.${customRules}`;

  const intentLine = customInstructions
    ? `Custom instructions: ${customInstructions}`
    : `Response intent: ${category}`;

  const user = `Here is the email thread:\n\n${formatThread(thread)}\n\n${intentLine}\nTone: ${tone}\n\nWrite the email reply body now.`;

  return callClaude(settings, system, user);
}
