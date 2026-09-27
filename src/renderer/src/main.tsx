import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StartupScreen } from "./components/StartupScreen";
import { Settings } from "./components/Settings";
import { AppProviders } from "./AppProviders";
import "./i18n";
import "./assets/index.css";

function Root(): React.JSX.Element {
  const [page, setPage] = useState(
    () => window.location.hash.replace("#", "") || "main"
  );

  useEffect(() => {
    const onHashChange = (): void => {
      setPage(window.location.hash.replace("#", "") || "main");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (page === "startup") {
    return (
      <AppProviders>
        <StartupScreen />
      </AppProviders>
    );
  }
  if (page === "settings") {
    return (
      <AppProviders>
        <Settings onClose={() => { window.location.hash = ""; }} />
      </AppProviders>
    );
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />
);
