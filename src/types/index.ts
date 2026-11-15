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

/** What we know about a new email the user is writing from scratch. */
export interface ComposeContext {
  currentUser: { name: string; email: string };
  /** Addresses already in an open new-message window's To/Cc fields. */
  recipients: { name: string; email: string }[];
  /** Free text from the sidebar's "Who's it for?" field. */
  recipientNote: string;
  /** Subject already typed in an open new-message window, if any. */
  subject: string;
}

/** A generated draft. `subject` is only set for new emails. */
export interface Draft {
  subject?: string;
  body: string;
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
  showSuggestedResponses: boolean;
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
