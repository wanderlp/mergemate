import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StartupScreen } from "./components/StartupScreen";
import { Settings } from "./components/Settings";
import "./i18n";
import "./assets/index.css";

const page = window.location.hash.replace("#", "") || "main";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  page === "startup" ? <StartupScreen /> : page === "settings" ? <Settings onClose={() => { window.location.hash = ""; }} /> : <App />
);
