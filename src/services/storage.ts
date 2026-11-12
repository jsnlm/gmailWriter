import type { SyncSettings, LocalSettings, PersonalInfoEntry, LLMConfig } from "../types";

const DEFAULT_SYNC: SyncSettings = {
  personalInfo: [
    { key: "Name", value: "" },
    { key: "Email", value: "" },
    { key: "Phone", value: "" },
    { key: "Calendly", value: "" },
  ],
  llmConfig: {
    provider: "claude",
    apiKey: "",
    model: "claude-opus-4-6",
  },
  promptInstructions: `- Limit the "—" character and three-item parallel lists, both of which signal AI writing.
- Avoid stock AI phrasing: "I hope this email finds you well," "I wanted to reach out," "I hope you're doing well," "circle back," "touch base," "happy to help," "feel free to," and openers like "Here's the thing."
- Avoid AI-favored words: delve, leverage, seamless, robust, navigate, elevate, streamline, testament.
- Don't open with pleasantries or close with "Let me know if you have any questions" unless it fits the context. Start with the point.
- Vary sentence length. Mix short sentences with longer ones rather than uniform medium-length ones.
- Use contractions. Allow occasional fragments. Match the formality to the relationship.
- Don't restate or summarize what you just said. Don't over-explain things the recipient already knows.`,
  showSuggestedResponses: false,
};

export const SIDEBAR_DEFAULT_WIDTH = 380;

const DEFAULT_LOCAL: LocalSettings = {
  sampleEmails: [],
  sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
};

export async function getSyncSettings(): Promise<SyncSettings> {
  const result = await chrome.storage.sync.get(["personalInfo", "llmConfig", "promptInstructions", "showSuggestedResponses"]);
  return {
    personalInfo: (result.personalInfo as PersonalInfoEntry[]) ?? DEFAULT_SYNC.personalInfo,
    llmConfig: (result.llmConfig as LLMConfig) ?? DEFAULT_SYNC.llmConfig,
    promptInstructions: (result.promptInstructions as string) ?? DEFAULT_SYNC.promptInstructions,
    showSuggestedResponses: (result.showSuggestedResponses as boolean) ?? DEFAULT_SYNC.showSuggestedResponses,
  };
}

export async function saveSyncSettings(settings: Partial<SyncSettings>): Promise<void> {
  await chrome.storage.sync.set(settings);
}

export async function getLocalSettings(): Promise<LocalSettings> {
  const result = await chrome.storage.local.get(["sampleEmails", "sidebarWidth"]);
  return {
    sampleEmails: (result.sampleEmails as string[]) ?? DEFAULT_LOCAL.sampleEmails,
    sidebarWidth: (result.sidebarWidth as number) ?? DEFAULT_LOCAL.sidebarWidth,
  };
}

export async function saveLocalSettings(settings: Partial<LocalSettings>): Promise<void> {
  await chrome.storage.local.set(settings);
}

export async function getAllSettings(): Promise<SyncSettings & LocalSettings> {
  const [sync, local] = await Promise.all([getSyncSettings(), getLocalSettings()]);
  return { ...sync, ...local };
}
