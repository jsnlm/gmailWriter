import React, { useState } from "react";
import {
  FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, IconButton,
  Typography, Alert, Box, Divider,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import type { LLMConfig, LLMProvider } from "../../types";
import * as llmProvider from "../../services/llmProvider";

interface Props {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}

const API_KEY_HINTS: Record<LLMProvider, string> = {
  claude:   "Get your key at console.anthropic.com",
  openai:   "Get your key at platform.openai.com",
  gemini:   "Get your key at aistudio.google.com",
  deepseek: "Get your key at platform.deepseek.com",
  mistral:  "Get your key at console.mistral.ai",
  xai:      "Get your key at console.x.ai",
  groq:     "Get your key at console.groq.com",
  cohere:   "Get your key at dashboard.cohere.com",
};

export function LLMConfigSection({ config, onChange }: Props) {
  const [showKey, setShowKey] = useState(false);
  const models = llmProvider.PROVIDER_MODELS[config.provider] ?? [];

  const handleProviderChange = (provider: LLMProvider) => {
    onChange({ ...config, provider, model: llmProvider.PROVIDER_MODELS[provider]?.[0] ?? "" });
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Typography variant="h6" className="font-semibold mb-1">LLM Configuration</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure which AI provider and model powers the email drafting.
        </Typography>
      </Box>

      <Divider />

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
        helperText={API_KEY_HINTS[config.provider]}
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
    </Box>
  );
}
