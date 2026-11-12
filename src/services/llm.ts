import type { ThreadData, SyncSettings, LocalSettings } from "../types";
import { callLLMProvider } from "./llmProvider";

type AllSettings = SyncSettings & LocalSettings;

// ── Formatters ───────────────────────────────────────────────────────────────

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
    .filter((e) => e.key && e.value)
    .map((e) => `${e.key}: ${e.value}`)
    .join("\n");
}

function formatSampleEmails(settings: AllSettings): string {
  return settings.sampleEmails
    .filter(Boolean)
    .map((email, i) => `--- Example ${i + 1} ---\n${email}`)
    .join("\n\n");
}

async function callLLM(settings: AllSettings, system: string, user: string): Promise<string> {
  const { provider, apiKey, model } = settings.llmConfig;
  if (!apiKey) throw new Error("No API key configured. Please add your API key in Settings.");

  console.log("[LLM Request]", { provider, model, system, user });

  const result = await callLLMProvider(provider, apiKey, model, system, user);

  console.log("[LLM Response]", result);
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateCategories(thread: ThreadData, settings: AllSettings): Promise<string[]> {
  const system = `You help users draft Gmail replies. Analyze the email thread and suggest specific, action-oriented response options tailored to the exact content.`;
  const user = `Here is the email thread:\n\n${formatThread(thread)}\n\nSuggest 3-5 specific, action-oriented response options for the most recent email. Make them specific to this thread's content, not generic.\n\nReturn ONLY a JSON array of strings. No other text.\nExample: ["Accept the proposal", "Request more details", "Decline politely"]`;

  const raw = await callLLM(settings, system, user);
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
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
  settings: AllSettings,
  previousDrafts: string[] = []
): Promise<string> {
  const personalInfo = formatPersonalInfo(settings);
  const sampleEmails = formatSampleEmails(settings);
  const customRules = settings.promptInstructions?.trim()
    ? `\n The following are the instructions of how to draft the email. Make sure that all instruction are followed:\n${settings.promptInstructions.trim()}`
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

  const previousDraftsSection = previousDrafts.length > 0
    ? `\nThe following drafts have already been generated. Write something distinctly different — vary the phrasing, structure, opening, and overall approach while still fulfilling the same intent:\n\n${previousDrafts.map((d, i) => `[Draft ${i + 1}]\n${d}`).join("\n\n")}\n`
    : "";

  const user = `Here is the email thread:\n\n${formatThread(thread)}\n\n${intentLine}\nTone: ${tone}\n${previousDraftsSection}\nWrite the email reply body now.`;

  return callLLM(settings, system, user);
}
