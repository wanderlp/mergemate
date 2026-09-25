import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AppSettings } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  diffViewMode: "side-by-side",
  diffAlgorithm: "advanced",
  minimapEnabled: true,
  fontSize: 15,
  ignoreWhitespace: false,
  defaultViewMode: "folders"
};

export interface UseAppSettingsReturn {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  loading: boolean;
}

const SettingsContext = createContext<UseAppSettingsReturn | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void window.electronAPI
      .getAppSettings()
      .then((s) => {
        setSettings({ ...DEFAULT_SETTINGS, ...s });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (settings) {
      document.documentElement.setAttribute("data-theme", settings.theme);
    }
  }, [settings?.theme]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
      setSettings((prev) => {
        if (!prev) return prev;
        const next = { ...prev, [key]: value };
        void window.electronAPI.setAppSettings({ [key]: value } as Partial<AppSettings>);
        return next;
      });
    },
    []
  );

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center bg-surface-app text-foreground"
        role="status"
        aria-live="polite"
      >
        Cargando…
      </div>
    );
  }

  const value: UseAppSettingsReturn = {
    settings: settings ?? DEFAULT_SETTINGS,
    updateSetting,
    loading
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings(): UseAppSettingsReturn {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used inside <SettingsProvider>");
  }
  return ctx;
}
