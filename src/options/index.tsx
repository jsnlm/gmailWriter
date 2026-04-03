import { createRoot } from "react-dom/client";
import { SettingsPage } from "../components/Settings/SettingsPage";
import "../tailwind.css";

const root = document.getElementById("root")!;
createRoot(root).render(<SettingsPage />);
