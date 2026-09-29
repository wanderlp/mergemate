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

  // El fondo (StartupScreen o App) se elige por route.path/route.from y se
  // mantiene SIEMPRE montado mientras Settings se abre y se cierra encima —
  // antes, el branch "settings" siempre montaba <App/> de fondo sin importar
  // el origen, así que abrir Settings desde StartupScreen desmontaba
  // StartupScreen por completo (y la remontaba al volver), lo que invalidaba
  // los IDs que useId() genera en TitleBar/MergeMateLogo en cada roundtrip (#31).
  const showStartup =
    route.path === "startup" || (route.path === "settings" && route.from === "startup");

  return (
    <AppProviders>
      {showStartup ? <StartupScreen /> : <App />}
      {route.path === "settings" && (
        <Settings
          onClose={() => {
            window.location.hash = route.from;
          }}
        />
      )}
    </AppProviders>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />
);
