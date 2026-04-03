import React, { useState } from "react";
import type { LLMConfig } from "../../types";

const MODELS: Record<string, { label: string; models: string[] }> = {
  claude: {
    label: "Anthropic Claude",
    models: [
      "claude-opus-4-6",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
    ],
  },
  openai: {
    label: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  },
};

interface Props {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}

export function LLMConfigSection({ config, onChange }: Props) {
  const [showKey, setShowKey] = useState(false);

  const providerModels = MODELS[config.provider]?.models ?? [];

  return (
    <section className="settings-section">
      <h2>LLM Configuration</h2>
      <p className="section-desc">Configure which AI model powers the email drafting.</p>

      <div className="field-group">
        <label>Provider</label>
        <select
          value={config.provider}
          onChange={(e) => {
            const provider = e.target.value as LLMConfig["provider"];
            const defaultModel = MODELS[provider]?.models[0] ?? "";
            onChange({ ...config, provider, model: defaultModel });
          }}
        >
          {Object.entries(MODELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label>API Key</label>
        <div className="input-with-action">
          <input
            type={showKey ? "text" : "password"}
            value={config.apiKey}
            onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
            placeholder={config.provider === "claude" ? "sk-ant-..." : "sk-..."}
          />
          <button className="toggle-btn" onClick={() => setShowKey((v) => !v)}>
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        <p className="field-hint">
          {config.provider === "claude"
            ? "Get your API key from console.anthropic.com"
            : "Get your API key from platform.openai.com"}
        </p>
      </div>

      <div className="field-group">
        <label>Model</label>
        <select
          value={config.model}
          onChange={(e) => onChange({ ...config, model: e.target.value })}
        >
          {providerModels.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </section>
  );
}
