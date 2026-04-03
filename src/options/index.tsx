import React from "react";
import { createRoot } from "react-dom/client";
import { SettingsPage } from "../components/Settings/SettingsPage";
import "./styles.css";

const root = document.getElementById("root")!;
createRoot(root).render(<SettingsPage />);
