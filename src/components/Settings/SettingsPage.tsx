import React, { useState, useEffect } from "react";
import { SampleEmailsSection } from "./SampleEmails";
import { PersonalInfoSection } from "./PersonalInfo";
import { LLMConfigSection } from "./LLMConfig";
import { PromptInstructionsSection } from "./PromptInstructions";
import { getSyncSettings, saveSyncSettings, getLocalSettings, saveLocalSettings } from "../../services/storage";
import type { SyncSettings, LocalSettings } from "../../types";

type Tab = "llm" | "writing" | "personal" | "emails";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("llm");
  const [sync, setSync] = useState<SyncSettings | null>(null);
  const [local, setLocal] = useState<LocalSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    Promise.all([getSyncSettings(), getLocalSettings()]).then(([s, l]) => {
      setSync(s);
      setLocal(l);
    });
  }, []);

  const handleSave = async () => {
    if (!sync || !local) return;
    setSaveStatus("saving");
    await Promise.all([
      saveSyncSettings({
        personalInfo: sync.personalInfo,
        llmConfig: sync.llmConfig,
        promptInstructions: sync.promptInstructions,
      }),
      saveLocalSettings({ sampleEmails: local.sampleEmails }),
    ]);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  if (!sync || !local) {
    return <div className="loading-page">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-title">
          <span className="settings-icon">✦</span>
          Gmail AI Drafter — Settings
        </div>
        <button
          className={`save-btn ${saveStatus === "saved" ? "saved" : ""}`}
          onClick={handleSave}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save Settings"}
        </button>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav">
          <button
            className={`nav-item ${activeTab === "llm" ? "active" : ""}`}
            onClick={() => setActiveTab("llm")}
          >
            🔑 LLM Config
          </button>
          <button
            className={`nav-item ${activeTab === "writing" ? "active" : ""}`}
            onClick={() => setActiveTab("writing")}
          >
            ✏️ Writing Instructions
          </button>
          <button
            className={`nav-item ${activeTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            👤 Personal Info
          </button>
          <button
            className={`nav-item ${activeTab === "emails" ? "active" : ""}`}
            onClick={() => setActiveTab("emails")}
          >
            ✉ Sample Emails
          </button>
        </nav>

        <main className="settings-main">
          {activeTab === "llm" && (
            <LLMConfigSection
              config={sync.llmConfig}
              onChange={(llmConfig) => setSync({ ...sync, llmConfig })}
            />
          )}
          {activeTab === "writing" && (
            <PromptInstructionsSection
              instructions={sync.promptInstructions}
              onChange={(promptInstructions) => setSync({ ...sync, promptInstructions })}
            />
          )}
          {activeTab === "personal" && (
            <PersonalInfoSection
              entries={sync.personalInfo}
              onChange={(personalInfo) => setSync({ ...sync, personalInfo })}
            />
          )}
          {activeTab === "emails" && (
            <SampleEmailsSection
              emails={local.sampleEmails}
              onChange={(sampleEmails) => setLocal({ ...local, sampleEmails })}
            />
          )}
        </main>
      </div>
    </div>
  );
}
