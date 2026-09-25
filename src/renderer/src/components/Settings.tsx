import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useAppSettings } from "../hooks/useAppSettings";
import { Button } from "./ui/button";
import { LANGUAGES } from "../i18n";

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { settings, updateSetting } = useAppSettings();

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      <header className="flex items-center gap-3 border-b border-[#3e3e42] bg-[#252526] px-4 py-2">
        <Button
          onClick={onClose}
          aria-label={t("settings.back")}
          title={t("settings.back")}
          variant="ghost"
          size="icon"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Button>
        <h1 className="text-base font-semibold text-[#cccccc]">{t("settings.title")}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-8">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#858585]">
              {t("settings.sectionAppearance")}
            </legend>

            <Field label={t("settings.theme")}>
              <select
                id="settings-theme"
                value={settings.theme}
                onChange={(e) =>
                  updateSetting("theme", e.target.value as "dark" | "light")
                }
                className="rounded bg-[#1e1e1e] px-2 py-1.5 text-sm text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
              >
                <option value="dark">{t("settings.themeDark")}</option>
                <option value="light">{t("settings.themeLight")}</option>
              </select>
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#858585]">
              {t("settings.sectionDiff")}
            </legend>

            <Field
              label={t("settings.diffAlgorithm")}
              hint={t("settings.diffAlgorithmHint")}
            >
              <select
                id="settings-diff-algorithm"
                value={settings.diffAlgorithm}
                onChange={(e) =>
                  updateSetting(
                    "diffAlgorithm",
                    e.target.value as "advanced" | "Myers" | "experimental"
                  )
                }
                className="rounded bg-[#1e1e1e] px-2 py-1.5 text-sm text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
              >
                <option value="advanced">Advanced</option>
                <option value="Myers">Myers</option>
                <option value="experimental">Experimental</option>
              </select>
            </Field>

            <ToggleField
              label={t("settings.minimapEnabled")}
              hint={t("settings.minimapEnabledHint")}
              checked={settings.minimapEnabled}
              onChange={(v) => updateSetting("minimapEnabled", v)}
              id="settings-minimap"
            />

            <Field label={t("settings.fontSize")}>
              <input
                id="settings-font-size"
                type="number"
                min={12}
                max={22}
                value={settings.fontSize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 12 && v <= 22) updateSetting("fontSize", v);
                }}
                className="w-20 rounded bg-[#1e1e1e] px-2 py-1.5 text-sm text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
              />
            </Field>

            <ToggleField
              label={t("settings.ignoreWhitespace")}
              hint={t("settings.ignoreWhitespaceHint")}
              checked={settings.ignoreWhitespace}
              onChange={(v) => updateSetting("ignoreWhitespace", v)}
              id="settings-ignore-whitespace"
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#858585]">
              {t("settings.sectionStartup")}
            </legend>

            <Field label={t("settings.defaultViewMode")}>
              <select
                id="settings-default-view-mode"
                value={settings.defaultViewMode}
                onChange={(e) =>
                  updateSetting(
                    "defaultViewMode",
                    e.target.value as "folders" | "files" | "blank"
                  )
                }
                className="rounded bg-[#1e1e1e] px-2 py-1.5 text-sm text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
              >
                <option value="folders">{t("settings.defaultViewModeFolders")}</option>
                <option value="files">{t("settings.defaultViewModeFiles")}</option>
                <option value="blank">{t("settings.defaultViewModeBlank")}</option>
              </select>
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#858585]">
              {t("settings.sectionLanguage")}
            </legend>

            <div className="rounded border border-[#3e3e42] bg-[#252526] px-4 py-3 text-sm text-[#aaaaaa]">
              {t("settings.languageNote")}
              <span className="ml-2 inline-flex items-center gap-2 rounded bg-[#1e1e1e] px-2 py-0.5 font-mono text-xs text-[#cccccc]">
                {LANGUAGES.find((l) => l.code === i18n.resolvedLanguage)?.label ?? i18n.resolvedLanguage}
              </span>
            </div>
          </fieldset>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="flex-1">
        <div className="text-sm text-[#cccccc]">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-[#858585]">{hint}</div>}
      </label>
      <div>{children}</div>
    </div>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
  id
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}): React.JSX.Element {
  return (
    <Field label={label} hint={hint}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-[#007acc]" : "bg-[#3e3e42]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </Field>
  );
}
