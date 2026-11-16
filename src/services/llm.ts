import type { ThreadData, ComposeContext, Draft, SyncSettings, LocalSettings } from "../types";
import * as llmProvider from "./llmProvider";
import { describeTone, type Tone } from "./tone";

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

/** e.g. "Thursday, November 12, 2026 at 6:35 PM PST (America/Los_Angeles)" */
function formatCurrentDateTime(now = new Date()): string {
  const formatted = now.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${formatted} (${timeZone})`;
}

/** Lets the model reason about how long ago messages were and what "Friday" means. */
function formatDateContext(): string {
  return `Current date and time: ${formatCurrentDateTime()}. Use this to interpret dates and relative times in the thread (e.g. "tomorrow", "next week") and to get any dates in your response right.`;
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

  console.log("[LLM Request a]", { provider, model, system, user });
  console.dir("[LLM Request b]", { provider, model, system, user });
  console.table({ provider, model, system, user });

  const result = await llmProvider.call(provider, apiKey, model, system, user);

  console.log("[LLM Response]", result);
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateCategories(thread: ThreadData, settings: AllSettings): Promise<string[]> {
  const system = `You help users draft Gmail replies. Analyze the email thread and suggest specific, action-oriented response options tailored to the exact content.`;
  const user = `${formatDateContext()}\n\nHere is the email thread:\n\n${formatThread(thread)}\n\nSuggest 3-5 specific, action-oriented response options for the most recent email. Make them specific to this thread's content, not generic.\n\nReturn ONLY a JSON array of strings. No other text.\nExample: ["Accept the proposal", "Request more details", "Decline politely"]`;

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

/** System prompt shared by replies and new emails; `outputRule` says what to return. */
function buildWriterSystem(userName: string, tone: Tone, settings: AllSettings, outputRule: string): string {
  const personalInfo = formatPersonalInfo(settings);
  const sampleEmails = formatSampleEmails(settings);
  const customRules = settings.promptInstructions?.trim()
    ? `\n The following are the instructions of how to draft the email. Make sure that all instruction are followed:\n${settings.promptInstructions.trim()}`
    : "";

  return `You are a writing assistant helping ${userName} draft emails. Write in first person as if you are ${userName}.

${personalInfo ? `Information about the sender:\n${personalInfo}\n` : ""}${sampleEmails ? `\nWriting style examples (match this style and voice):\n${sampleEmails}\n` : ""}
Rules:
- ${outputRule}
- Write in this tone: ${describeTone(tone)}.
- Keep it natural and human-sounding.
- Sign off appropriately based on the tone.${customRules}`;
}

function formatPreviousDrafts(previousDrafts: string[]): string {
  return previousDrafts.length > 0
    ? `\nThe following drafts have already been generated. Write something distinctly different — vary the phrasing, structure, opening, and overall approach while still fulfilling the same intent:\n\n${previousDrafts.map((d, i) => `[Draft ${i + 1}]\n${d}`).join("\n\n")}\n`
    : "";
}

export async function generateDraft(
  thread: ThreadData,
  category: string,
  tone: Tone,
  customInstructions: string,
  settings: AllSettings,
  previousDrafts: string[] = []
): Promise<string> {
  const system = buildWriterSystem(
    thread.currentUser.name || "the user",
    tone,
    settings,
    `Output ONLY the email body text. No subject line, no "Subject:", no greeting instructions, no meta-commentary.`
  );

  const intentLine = customInstructions
    ? `Custom instructions: ${customInstructions}`
    : `Response intent: ${category}`;

  const user = `${formatDateContext()}\n\nHere is the email thread:\n\n${formatThread(thread)}\n\n${intentLine}\nTone: ${describeTone(tone)}\n${formatPreviousDrafts(previousDrafts)}\nWrite the email reply body now.`;

  return callLLM(settings, system, user);
}

/** Splits "Subject: ...\n\nbody" into its parts; tolerates a missing subject line. */
function parseSubjectAndBody(raw: string): Draft {
  const match = raw.trim().match(/^subject:\s*(.*)\n+([\s\S]*)$/i);
  if (!match) return { subject: "", body: raw.trim() };
  return { subject: match[1].trim(), body: match[2].trim() };
}

export async function generateNewEmail(
  context: ComposeContext,
  instructions: string,
  tone: Tone,
  settings: AllSettings,
  previousDrafts: string[] = []
): Promise<Draft> {
  const system = buildWriterSystem(
    context.currentUser.name || "the user",
    tone,
    settings,
    `Output the subject line first, as "Subject: <subject>", then a blank line, then the email body. No other text or meta-commentary.`
  );

  const recipientLines = [
    context.recipients.length > 0
      ? `Recipients: ${context.recipients.map((r) => (r.name && r.name !== r.email ? `${r.name} <${r.email}>` : r.email)).join(", ")}`
      : "",
    context.recipientNote.trim() ? `Who it's for: ${context.recipientNote.trim()}` : "",
    context.subject.trim() ? `The user already chose this subject; reuse it: ${context.subject.trim()}` : "",
  ].filter(Boolean).join("\n");

  const user = `${formatDateContext()}\n\nWrite a new email (not a reply).\n${recipientLines ? `${recipientLines}\n` : ""}\nWhat the email should say: ${instructions}\nTone: ${describeTone(tone)}\n${formatPreviousDrafts(previousDrafts)}\nWrite the subject and email body now.`;

  return parseSubjectAndBody(await callLLM(settings, system, user));
}
