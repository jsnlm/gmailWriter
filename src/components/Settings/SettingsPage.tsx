import React, { useState, useEffect } from "react";
import {
  Box, AppBar, Toolbar, Typography, Button,
  Tabs, Tab, Container, CircularProgress,
  Snackbar, Alert,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { SampleEmailsSection } from "./SampleEmails";
import { PersonalInfoSection } from "./PersonalInfo";
import { LLMConfigSection } from "./LLMConfig";
import { PromptInstructionsSection } from "./PromptInstructions";
import { DisplaySettingsSection } from "./DisplaySettings";
import { getSyncSettings, saveSyncSettings, getLocalSettings, saveLocalSettings } from "../../services/storage";
import { gmailTheme } from "../../theme";
import type { SyncSettings, LocalSettings } from "../../types";

type Tab = "llm" | "writing" | "personal" | "emails" | "display";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("llm");
  const [sync, setSync] = useState<SyncSettings | null>(null);
  const [local, setLocal] = useState<LocalSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  useEffect(() => {
    Promise.all([getSyncSettings(), getLocalSettings()]).then(([s, l]) => {
      setSync(s);
      setLocal(l);
    });
  }, []);

  const handleSave = async () => {
    if (!sync || !local) return;
    setSaving(true);
    try {
      await Promise.all([
        saveSyncSettings({ personalInfo: sync.personalInfo, llmConfig: sync.llmConfig, promptInstructions: sync.promptInstructions, showSuggestedResponses: sync.showSuggestedResponses }),
        saveLocalSettings({ sampleEmails: local.sampleEmails }),
      ]);
      setSnackbar({ open: true, message: "Settings saved", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to save settings", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!sync || !local) {
    return (
      <ThemeProvider theme={gmailTheme}>
        <Box className="flex items-center justify-center h-screen">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={gmailTheme}>
      <CssBaseline />
      <Box className="min-h-screen bg-gray-50">
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar>
            <AutoAwesomeIcon sx={{ color: "primary.main", mr: 1.5 }} />
            <Typography variant="h6" sx={{ color: "text.primary", flexGrow: 1, fontWeight: 600 }}>
              Gmail AI Drafter — Settings
            </Typography>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </Toolbar>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v as Tab)}
            sx={{ px: 2 }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="LLM Config" value="llm" />
            <Tab label="Writing Instructions" value="writing" />
            <Tab label="Personal Info" value="personal" />
            <Tab label="Sample Emails" value="emails" />
            <Tab label="Display" value="display" />
          </Tabs>
        </AppBar>

        <Container maxWidth="md" className="py-8">
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
          {activeTab === "display" && (
            <DisplaySettingsSection
              showSuggestedResponses={sync.showSuggestedResponses}
              onChange={(showSuggestedResponses) => setSync({ ...sync, showSuggestedResponses })}
            />
          )}
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
