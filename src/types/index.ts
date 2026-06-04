export interface EmailMessage {
  id: string;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  timestamp: string;
  body: string;
}

export interface ThreadData {
  subject: string;
  messages: EmailMessage[];
  currentUser: { name: string; email: string };
}

export interface PersonalInfoEntry {
  key: string;
  value: string;
}

export type LLMProvider =
  | "claude"
  | "openai"
  | "gemini"
  | "deepseek"
  | "mistral"
  | "xai"
  | "groq"
  | "cohere";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export interface SyncSettings {
  personalInfo: PersonalInfoEntry[];
  llmConfig: LLMConfig;
  promptInstructions: string;
}

export interface LocalSettings {
  sampleEmails: string[];
  sidebarWidth: number;
}

export type MessageType =
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "GET_CATEGORIES"; thread: ThreadData; settings: SyncSettings & LocalSettings }
  | { type: "GET_DRAFT"; thread: ThreadData; category: string; tone: string; customInstructions: string; settings: SyncSettings & LocalSettings }
  | { type: "OPEN_OPTIONS" };

export interface CategoriesResponse {
  categories: string[];
}

export interface DraftResponse {
  draft: string;
}
