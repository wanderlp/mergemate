import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StartupScreen } from "./components/StartupScreen";
import { Settings } from "./components/Settings";
import { AppProviders } from "./AppProviders";
import "./i18n";
import "./assets/index.css";

type Route =
  | { path: "main" }
  | { path: "startup" }
  | { path: "settings"; from: "startup" | "main" };

// Parsea el hash soportando query string (ej. "settings?from=startup") y
// retrocompatibilidad con el formato previo ("settings" sin query → from="main").
function parseHash(hash: string): Route {
  const raw = hash.replace("#", "");
  if (raw === "startup") return { path: "startup" };
  if (raw.startsWith("settings")) {
    const query = raw.includes("?") ? raw.split("?")[1] ?? "" : "";
    const fromParam = new URLSearchParams(query).get("from");
    const from: "startup" | "main" = fromParam === "startup" ? "startup" : "main";
    return { path: "settings", from };
  }
  return { path: "main" };
}

function Root(): React.JSX.Element {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = (): void => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route.path === "startup") {
    return (
      <AppProviders>
        <StartupScreen />
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      {route.path === "settings" && (
        <Settings
          onClose={() => {
            window.location.hash = route.from;
          }}
        />
      )}
      <App />
    </AppProviders>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />
);
