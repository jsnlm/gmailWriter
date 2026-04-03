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
  promptInstructions: "",
};

const DEFAULT_LOCAL: LocalSettings = {
  sampleEmails: [],
};

export async function getSyncSettings(): Promise<SyncSettings> {
  const result = await chrome.storage.sync.get(["personalInfo", "llmConfig", "promptInstructions"]);
  return {
    personalInfo: (result.personalInfo as PersonalInfoEntry[]) ?? DEFAULT_SYNC.personalInfo,
    llmConfig: (result.llmConfig as LLMConfig) ?? DEFAULT_SYNC.llmConfig,
    promptInstructions: (result.promptInstructions as string) ?? DEFAULT_SYNC.promptInstructions,
  };
}

export async function saveSyncSettings(settings: Partial<SyncSettings>): Promise<void> {
  await chrome.storage.sync.set(settings);
}

export async function getLocalSettings(): Promise<LocalSettings> {
  const result = await chrome.storage.local.get(["sampleEmails"]);
  return {
    sampleEmails: (result.sampleEmails as string[]) ?? DEFAULT_LOCAL.sampleEmails,
  };
}

export async function saveLocalSettings(settings: Partial<LocalSettings>): Promise<void> {
  await chrome.storage.local.set(settings);
}

export async function getAllSettings(): Promise<SyncSettings & LocalSettings> {
  const [sync, local] = await Promise.all([getSyncSettings(), getLocalSettings()]);
  return { ...sync, ...local };
}
