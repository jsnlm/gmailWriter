import React, { useState, useEffect, useRef } from "react";
import {
  AppBar, Toolbar, Button, Divider, Stack,
  Tab, CircularProgress,
  Snackbar, Alert,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SampleEmailsSection } from "./SampleEmails";
import { PersonalInfoSection } from "./PersonalInfo";
import { LLMConfigSection } from "./LLMConfig";
import { PromptInstructionsSection } from "./PromptInstructions";
import { FullPageCenter, PageRoot, SectionTabs, ScrollArea, PageContent } from "./SettingsPage.styles";
import { AppLogo, ToolbarTitle } from "../shared";
import { DisplaySettingsSection } from "./DisplaySettings";
import * as storage from "../../services/storage";
import { gmailTheme } from "../../theme";
import type { SyncSettings, LocalSettings } from "../../types";

type Section = "llm" | "writing" | "personal" | "emails" | "display";

/** Stops the user from accidentally closing or reloading the page with unsaved
 *  changes; Chrome then asks "Leave site?" (its wording, which can't be changed). */
function warnBeforeLeaving(on: boolean) {
  window.onbeforeunload = on ? (e) => { e.preventDefault(); } : null;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("llm");
  const [sync, setSync] = useState<SyncSettings | null>(null);
  const [local, setLocal] = useState<LocalSettings | null>(null);
  const [savedSync, setSavedSync] = useState<SyncSettings | null>(null);
  const [savedLocal, setSavedLocal] = useState<LocalSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const isDirty = !same(sync, savedSync) || !same(local, savedLocal);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<Section, React.RefObject<HTMLDivElement | null>> = {
    llm: useRef<HTMLDivElement>(null),
    writing: useRef<HTMLDivElement>(null),
    personal: useRef<HTMLDivElement>(null),
    emails: useRef<HTMLDivElement>(null),
    display: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    Promise.all([storage.getSyncSettings(), storage.getLocalSettings()]).then(([s, l]) => {
      setSync(s);
      setLocal(l);
      setSavedSync(s);
      setSavedLocal(l);
    });
  }, []);

  const settingsLoaded = sync !== null && local !== null;

  useEffect(() => {
    if (!settingsLoaded) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id as Section);
        });
      },
      { root: scrollContainerRef.current, rootMargin: "-5% 0px -85% 0px" }
    );
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, [settingsLoaded]);

  // Every edit goes through these, so the leave-page warning stays in step
  // with whether anything is unsaved.
  const updateSync = (next: SyncSettings) => {
    setSync(next);
    warnBeforeLeaving(!same(next, savedSync) || !same(local, savedLocal));
  };
  const updateLocal = (next: LocalSettings) => {
    setLocal(next);
    warnBeforeLeaving(!same(sync, savedSync) || !same(next, savedLocal));
  };

  const handleDiscard = () => {
    setSync(savedSync);
    setLocal(savedLocal);
    warnBeforeLeaving(false);
  };

  // Cmd+S / Ctrl+S saves, instead of the browser's "save page as"
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (isDirty && !saving) handleSave();
    }
  };

  const handleSave = async () => {
    if (!sync || !local) return;
    setSaving(true);
    try {
      await Promise.all([
        storage.saveSyncSettings({ personalInfo: sync.personalInfo, llmConfig: sync.llmConfig, promptInstructions: sync.promptInstructions, showSuggestedResponses: sync.showSuggestedResponses }),
        storage.saveLocalSettings({ sampleEmails: local.sampleEmails }),
      ]);
      setSavedSync(sync);
      setSavedLocal(local);
      warnBeforeLeaving(false);
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
        <CssBaseline />
        <FullPageCenter>
          <CircularProgress />
        </FullPageCenter>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={gmailTheme}>
      <CssBaseline />
      <PageRoot onKeyDown={handleKeyDown}>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <AppLogo size={24} />
            <ToolbarTitle variant="h6">
              Gmail AI Drafter - Settings
            </ToolbarTitle>
          </Toolbar>
          <SectionTabs
            value={activeSection}
            onChange={(_, v) => sectionRefs[v as Section].current?.scrollIntoView({ behavior: 'smooth' })}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="LLM Config" value="llm" />
            <Tab label="Writing Instructions" value="writing" />
            <Tab label="Display" value="display" />
            <Tab label="Personal Info" value="personal" />
            <Tab label="Sample Emails" value="emails" />
          </SectionTabs>
          <Divider />
        </AppBar>

        <ScrollArea ref={scrollContainerRef}>
          <PageContent maxWidth="md">
            <Stack spacing={6}>
            <div id="llm" ref={sectionRefs.llm}>
              <LLMConfigSection
                config={sync.llmConfig}
                onChange={(llmConfig) => updateSync({ ...sync, llmConfig })}
              />
            </div>
            <div id="writing" ref={sectionRefs.writing}>
              <PromptInstructionsSection
                instructions={sync.promptInstructions}
                onChange={(promptInstructions) => updateSync({ ...sync, promptInstructions })}
              />
            </div>
            <div id="display" ref={sectionRefs.display}>
              <DisplaySettingsSection
                showSuggestedResponses={sync.showSuggestedResponses}
                onChange={(showSuggestedResponses) => updateSync({ ...sync, showSuggestedResponses })}
              />
            </div>
            <div id="personal" ref={sectionRefs.personal}>
              <PersonalInfoSection
                entries={sync.personalInfo}
                onChange={(personalInfo) => updateSync({ ...sync, personalInfo })}
              />
            </div>
            <div id="emails" ref={sectionRefs.emails}>
              <SampleEmailsSection
                emails={local.sampleEmails}
                onChange={(sampleEmails) => updateLocal({ ...local, sampleEmails })}
              />
            </div>
            </Stack>
          </PageContent>
        </ScrollArea>
      </PageRoot>

      {/* Stays up for as long as anything is unsaved */}
      <Snackbar
        open={isDirty}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message="You have unsaved changes"
        action={
          <>
            <Button color="inherit" size="small" onClick={handleDiscard} disabled={saving}>
              Discard
            </Button>
            <Button variant="contained" size="small" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      />

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
