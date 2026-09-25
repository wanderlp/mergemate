import { useState, useCallback, useEffect } from "react";
import type { AppSettings } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
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

export function useAppSettings(): UseAppSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
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

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        void window.electronAPI.setAppSettings({ [key]: value } as Partial<AppSettings>);
        return next;
      });
    },
    []
  );

  return { settings, updateSetting, loading };
}
