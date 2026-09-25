import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StartupScreen } from "./components/StartupScreen";
import { Settings } from "./components/Settings";
import { AppProviders } from "./AppProviders";
import "./i18n";
import "./assets/index.css";

const page = window.location.hash.replace("#", "") || "main";

const SettingsApp = (): React.JSX.Element => (
  <AppProviders>
    <Settings onClose={() => { window.location.hash = ""; }} />
  </AppProviders>
);

const StartupApp = (): React.JSX.Element => (
  <AppProviders>
    <StartupScreen />
  </AppProviders>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  page === "startup" ? <StartupApp /> : page === "settings" ? <SettingsApp /> : <App />
);
