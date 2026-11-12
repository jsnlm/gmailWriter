import type { ThreadData, SyncSettings, LocalSettings, LLMProvider } from "../types";

type AllSettings = SyncSettings & LocalSettings;

// ── Provider registry ────────────────────────────────────────────────────────

type ApiFormat = "anthropic" | "openai" | "gemini";

interface ProviderConfig {
  format: ApiFormat;
  baseUrl: string;
}

export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderConfig> = {
  claude:    { format: "anthropic", baseUrl: "https://api.anthropic.com" },
  openai:    { format: "openai",    baseUrl: "https://api.openai.com" },
  gemini:    { format: "gemini",    baseUrl: "https://generativelanguage.googleapis.com" },
  deepseek:  { format: "openai",    baseUrl: "https://api.deepseek.com" },
  mistral:   { format: "openai",    baseUrl: "https://api.mistral.ai" },
  xai:       { format: "openai",    baseUrl: "https://api.x.ai" },
  groq:      { format: "openai",    baseUrl: "https://api.groq.com/openai" },
  cohere:    { format: "openai",    baseUrl: "https://api.cohere.com/compatibility" },
};

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  claude:   "Anthropic Claude",
  openai:   "OpenAI",
  gemini:   "Google Gemini",
  deepseek: "DeepSeek",
  mistral:  "Mistral AI",
  xai:      "xAI (Grok)",
  groq:     "Groq",
  cohere:   "Cohere",
};

export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  claude:   ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  openai:   ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  gemini:   ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  mistral:  ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
  xai:      ["grok-3", "grok-3-mini", "grok-2-1212"],
  groq:     ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"],
  cohere:   ["command-r-plus", "command-r", "command-r7b-12-2024"],
};

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

// ── API callers ───────────────────────────────────────────────────────────────

async function callAnthropic(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model, max_tokens: 1024, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Anthropic API error ${res.status}`);
  }
  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

async function callOpenAICompatible(baseUrl: string, apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `API error ${res.status}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

async function callGemini(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: user }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Gemini API error ${res.status}`);
  }
  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates[0]?.content?.parts[0]?.text ?? "";
}

async function callLLM(settings: AllSettings, system: string, user: string): Promise<string> {
  const { provider, apiKey, model } = settings.llmConfig;
  if (!apiKey) throw new Error("No API key configured. Please add your API key in Settings.");

  const config = PROVIDER_CONFIGS[provider] ?? PROVIDER_CONFIGS.claude;

  console.log("[LLM Request]", { provider, model, system, user });

  let result: string;
  switch (config.format) {
    case "anthropic": result = await callAnthropic(apiKey, model, system, user); break;
    case "gemini":    result = await callGemini(apiKey, model, system, user); break;
    default:          result = await callOpenAICompatible(config.baseUrl, apiKey, model, system, user); break;
  }

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
