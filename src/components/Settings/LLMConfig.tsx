import React, { useState } from "react";
import {
  FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, IconButton,
  Alert, Link,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import type { LLMConfig, LLMProvider } from "../../types";
import * as llmProvider from "../../services/llmProvider";
import { SettingsSection } from "./SettingsSection";

interface Props {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}

/** Each provider's page for creating an API key. */
const API_KEY_PAGES: Record<LLMProvider, string> = {
  claude:   "https://console.anthropic.com/settings/keys",
  openai:   "https://platform.openai.com/api-keys",
  gemini:   "https://aistudio.google.com/apikey",
  deepseek: "https://platform.deepseek.com/api_keys",
  mistral:  "https://console.mistral.ai/api-keys",
  xai:      "https://console.x.ai",
  groq:     "https://console.groq.com/keys",
  cohere:   "https://dashboard.cohere.com/api-keys",
};

/** "Get your key at console.anthropic.com", with the site as a link that opens in a new tab. */
function ApiKeyHint({ provider }: { provider: LLMProvider }) {
  const url = API_KEY_PAGES[provider];
  return (
    <>
      Get your key at{" "}
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {new URL(url).hostname}
      </Link>
    </>
  );
}

export function LLMConfigSection({ config, onChange }: Props) {
  const [showKey, setShowKey] = useState(false);
  const models = llmProvider.PROVIDER_MODELS[config.provider] ?? [];

  const handleProviderChange = (provider: LLMProvider) => {
    onChange({ ...config, provider, model: llmProvider.PROVIDER_MODELS[provider]?.[0] ?? "" });
  };

  return (
    <SettingsSection
      title="LLM Configuration"
      description="Configure which AI provider and model powers the email drafting."
    >
      <FormControl fullWidth>
        <InputLabel>Provider</InputLabel>
        <Select
          value={config.provider}
          label="Provider"
          onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
        >
          {(Object.keys(llmProvider.PROVIDER_LABELS) as LLMProvider[]).map((key) => (
            <MenuItem key={key} value={key}>{llmProvider.PROVIDER_LABELS[key]}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="API Key"
        fullWidth
        type={showKey ? "text" : "password"}
        value={config.apiKey}
        onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
        placeholder={config.provider === "claude" ? "sk-ant-..." : config.provider === "gemini" ? "AIza..." : "sk-..."}
        helperText={<ApiKeyHint provider={config.provider} />}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowKey((v) => !v)} edge="end">
                  {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <FormControl fullWidth>
        <InputLabel>Model</InputLabel>
        <Select
          value={models.includes(config.model) ? config.model : models[0] ?? ""}
          label="Model"
          onChange={(e) => onChange({ ...config, model: e.target.value })}
        >
          {models.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {config.provider === "gemini" && (
        <Alert severity="info" variant="outlined">
          Gemini uses your API key as a URL query parameter. Make sure your key has the Generative Language API enabled.
        </Alert>
      )}
    </SettingsSection>
  );
}
