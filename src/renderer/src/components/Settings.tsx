import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, X, Copy, Check } from "lucide-react";
import { version } from "../../../../package.json";
import { useAppSettings } from "../hooks/useAppSettings";
import { Button } from "./ui/button";
import { MergeMateLogo } from "./MergeMateLogo";
import { LANGUAGES } from "../i18n";
import type { SystemInfo } from "../types";

interface SettingsProps {
  onClose: () => void;
  /**
   * "page": pantalla completa con "← Volver", usada cuando se abre desde
   * StartupScreen (no hay nada de contexto detrás que valga la pena ver).
   * "dialog": dialogo centrado con "✕", usado cuando se abre desde App (el
   * usuario probablemente quiere seguir viendo sus tabs/carpetas detrás).
   */
  variant: "page" | "dialog";
  /** Id de sección (sin el prefijo "settings-section-") a la que hacer scroll al montar, ej. "about". */
  initialSection?: string;
}

function useScrollToSection(
  containerRef: React.RefObject<HTMLElement>,
  section: string | undefined
): void {
  useEffect(() => {
    if (!section) return;
    const el = document.getElementById(`settings-section-${section}`);
    el?.scrollIntoView({ block: "start" });
  }, [containerRef, section]);
}

export function Settings({ onClose, variant, initialSection }: SettingsProps): React.JSX.Element {
  const { t } = useTranslation();
  const mainRef = React.useRef<HTMLElement>(null);
  const dialogBodyRef = React.useRef<HTMLDivElement>(null);

  useScrollToSection(variant === "dialog" ? dialogBodyRef : mainRef, initialSection);

  if (variant === "dialog") {
    return (
      <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
          <Dialog.Content
            // No-drag por consistencia con la variante de pagina — un dialogo
            // centrado normalmente no pisa la franja de arrastre de la
            // TitleBar, pero en ventanas muy bajas podria hacerlo.
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            className="fixed left-1/2 top-1/2 z-40 flex max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
          >
            <header className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-4 py-3">
              <Dialog.Title className="text-base font-semibold">{t("settings.title")}</Dialog.Title>
              <Button
                onClick={onClose}
                aria-label={t("settings.close")}
                title={t("settings.close")}
                variant="ghost"
                size="icon"
                className="ml-auto"
              >
                <X size={16} aria-hidden="true" />
              </Button>
            </header>
            <div ref={dialogBodyRef} className="overflow-y-auto px-6 py-6">
              <SettingsForm />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    // WebkitAppRegion "no-drag" explicito: la TitleBar de StartupScreen sigue
    // montada DEBAJO de esta pantalla y marca su franja izquierda como "drag"
    // (arrastrar ventana). Electron decide la region de arrastre a nivel
    // nativo, no respeta z-index/position — sin este "no-drag" el click en
    // "Volver" (que cae justo en esa franja izquierda) se interpreta como
    // iniciar un arrastre de ventana en vez de un click.
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[hsl(var(--surface-app))]"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <header className="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2">
        <Button
          onClick={onClose}
          aria-label={t("settings.back")}
          title={t("settings.back")}
          variant="ghost"
          size="icon"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Button>
        <h1 className="text-base font-semibold">{t("settings.title")}</h1>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto px-6 py-6">
        <SettingsForm />
      </main>
    </div>
  );
}

function SettingsForm(): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { settings, updateSetting } = useAppSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
          {t("settings.sectionAppearance")}
        </legend>

        <Field label={t("settings.theme")} htmlFor="settings-theme">
          <select
            id="settings-theme"
            value={settings.theme}
            onChange={(e) => updateSetting("theme", e.target.value as "dark" | "light")}
            className="rounded bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          >
            <option value="dark">{t("settings.themeDark")}</option>
            <option value="light">{t("settings.themeLight")}</option>
          </select>
        </Field>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
          {t("settings.sectionDiff")}
        </legend>

        <Field
          label={t("settings.diffAlgorithm")}
          hint={t("settings.diffAlgorithmHint")}
          htmlFor="settings-diff-algorithm"
        >
          <select
            id="settings-diff-algorithm"
            value={settings.diffAlgorithm}
            onChange={(e) =>
              updateSetting("diffAlgorithm", e.target.value as "advanced" | "Myers" | "experimental")
            }
            className="rounded bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
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

        <Field label={t("settings.fontSize")} htmlFor="settings-font-size">
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
            className="w-20 rounded bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
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
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
          {t("settings.sectionStartup")}
        </legend>

        <Field label={t("settings.defaultViewMode")} htmlFor="settings-default-view-mode">
          <select
            id="settings-default-view-mode"
            value={settings.defaultViewMode}
            onChange={(e) =>
              updateSetting("defaultViewMode", e.target.value as "folders" | "files" | "blank")
            }
            className="rounded bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          >
            <option value="folders">{t("settings.defaultViewModeFolders")}</option>
            <option value="files">{t("settings.defaultViewModeFiles")}</option>
            <option value="blank">{t("settings.defaultViewModeBlank")}</option>
          </select>
        </Field>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
          {t("settings.sectionLanguage")}
        </legend>

        <Field label={t("settings.language")} htmlFor="settings-language">
          <select
            id="settings-language"
            value={i18n.resolvedLanguage}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="rounded bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <AboutSection />
    </div>
  );
}

const COPY_FEEDBACK_MS = 2000;

function formatPlatform(info: SystemInfo): string {
  if (info.platform === "win32") {
    return info.arch === "x64" ? "Windows (64 bits)" : `Windows (${info.arch})`;
  }
  if (info.platform === "darwin") {
    return info.arch === "arm64" ? "macOS (Apple Silicon)" : `macOS (${info.arch})`;
  }
  if (info.platform === "linux") return `Linux (${info.arch})`;
  return `${info.platform} (${info.arch})`;
}

function buildDiagnostic(info: SystemInfo): string {
  return [
    `MergeMate ${info.appVersion}`,
    `Plataforma: ${formatPlatform(info)}`,
    `Electron: ${info.electronVersion}`,
    `Node: ${info.nodeVersion}`,
    `Chrome: ${info.chromeVersion}`,
    `Configuración: ${info.configPath}`
  ].join("\n");
}

function AboutSection(): React.JSX.Element {
  const { t } = useTranslation();
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    window.electronAPI.getSystemInfo().then((snapshot) => {
      if (active) setInfo(snapshot);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const handle = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(handle);
  }, [copied]);

  async function handleCopy(): Promise<void> {
    if (!info) return;
    await navigator.clipboard.writeText(buildDiagnostic(info));
    setCopied(true);
  }

  return (
    <fieldset id="settings-section-about" className="space-y-4">
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
        {t("settings.sectionAbout")}
      </legend>

      <div className="flex items-center gap-3">
        <MergeMateLogo size={32} />
        <div>
          <div className="text-sm font-semibold text-[hsl(var(--foreground))]">MergeMate</div>
          <div className="text-xs text-[hsl(var(--text-muted))]">{t("about.version", { version })}</div>
        </div>
      </div>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-[hsl(var(--text-muted))]">{t("about.descriptionLabel")}</dt>
        <dd className="text-[hsl(var(--muted-foreground))]">{t("about.description")}</dd>
        <dt className="text-[hsl(var(--text-muted))]">{t("about.copyrightLabel")}</dt>
        <dd className="text-[hsl(var(--muted-foreground))]">
          {t("about.copyright", { year: new Date().getFullYear() })}
        </dd>
      </dl>

      <button
        type="button"
        className="text-xs text-[hsl(var(--primary))] hover:underline"
        onClick={() => window.electronAPI.openExternal("https://github.com/wanderlp/mergemate")}
      >
        {t("about.repo")}
      </button>

      <div className="space-y-2 rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-app))] p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
          {t("about.system.title")}
        </h3>

        {info && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs">
            <dt className="text-[hsl(var(--text-muted))]">{t("about.system.platform")}</dt>
            <dd className="font-mono text-[hsl(var(--muted-foreground))]">{formatPlatform(info)}</dd>
            <dt className="text-[hsl(var(--text-muted))]">Electron</dt>
            <dd className="font-mono text-[hsl(var(--muted-foreground))]">{info.electronVersion}</dd>
            <dt className="text-[hsl(var(--text-muted))]">Node</dt>
            <dd className="font-mono text-[hsl(var(--muted-foreground))]">{info.nodeVersion}</dd>
            <dt className="text-[hsl(var(--text-muted))]">Chrome</dt>
            <dd className="font-mono text-[hsl(var(--muted-foreground))]">{info.chromeVersion}</dd>
            <dt className="text-[hsl(var(--text-muted))]">{t("about.system.configPath")}</dt>
            <dd className="break-all font-mono text-[hsl(var(--muted-foreground))]">{info.configPath}</dd>
          </dl>
        )}

        <Button variant="ghost" size="sm" onClick={() => void handleCopy()} disabled={!info}>
          {copied ? (
            <Check size={14} aria-hidden="true" className="mr-1.5" />
          ) : (
            <Copy size={14} aria-hidden="true" className="mr-1.5" />
          )}
          {copied ? t("about.system.copied") : t("about.system.copyButton")}
        </Button>
      </div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="flex-1" htmlFor={htmlFor}>
        <div className="text-sm text-[hsl(var(--foreground))]">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-[hsl(var(--text-muted))]">{hint}</div>}
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
    <Field label={label} hint={hint} htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"
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
