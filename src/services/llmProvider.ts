// Hand-written HTTP clients for each LLM provider we support.
//
// Each provider is called with a single system + user prompt and returns plain
// text. This is deliberately minimal: three request formats (Anthropic,
// OpenAI-compatible, Gemini) cover all eight providers in ~100 lines with no
// dependencies.
//
// TODO: Consider migrating to the Vercel AI SDK (`ai` + `@ai-sdk/*` packages)
// if the provider APIs evolve enough that keeping these clients up to date
// becomes a burden, or if we need streaming, structured output or tool use.
// It would likely be easier to maintain, but it is not free: as of Nov 2026,
// bundling `ai` with all eight provider packages added ~1.5 MB minified
// (~350 KB gzipped) to the service worker, versus ~5 KB for this file.
// Evaluate that trade-off before switching.

import type { LLMProvider } from "../types";

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

export async function call(
  provider: LLMProvider,
  apiKey: string,
  model: string,
  system: string,
  user: string
): Promise<string> {
  const config = PROVIDER_CONFIGS[provider] ?? PROVIDER_CONFIGS.claude;
  switch (config.format) {
    case "anthropic": return callAnthropic(apiKey, model, system, user);
    case "gemini":    return callGemini(apiKey, model, system, user);
    default:          return callOpenAICompatible(config.baseUrl, apiKey, model, system, user);
  }
}
