import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, X, Copy, Check, SlidersHorizontal, GitCompare, Info } from "lucide-react";
import { version } from "../../../../package.json";
import { useAppSettings } from "../hooks/useAppSettings";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { MergeMateLogo } from "./MergeMateLogo";
import { LANGUAGES } from "../i18n";
import { cn } from "../lib/utils";
import type { SystemInfo } from "../types";

type SectionId = "general" | "diffEditor" | "about";

const SECTIONS: { id: SectionId; icon: typeof SlidersHorizontal; labelKey: string }[] = [
  { id: "general", icon: SlidersHorizontal, labelKey: "settings.sectionGeneral" },
  { id: "diffEditor", icon: GitCompare, labelKey: "settings.sectionDiffEditor" },
  { id: "about", icon: Info, labelKey: "settings.sectionAbout" }
];

interface SettingsProps {
  onClose: () => void;
  /**
   * "page": pantalla completa con "← Volver", usada cuando se abre desde
   * StartupScreen (no hay nada de contexto detrás que valga la pena ver).
   * "dialog": dialogo centrado con "✕", usado cuando se abre desde App (el
   * usuario probablemente quiere seguir viendo sus tabs/carpetas detrás).
   */
  variant: "page" | "dialog";
  /** Id de sección (ej. "about") activa al montar. Por defecto "general". */
  initialSection?: string;
}

function resolveInitialSection(section: string | undefined): SectionId {
  return SECTIONS.some((s) => s.id === section) ? (section as SectionId) : "general";
}

export function Settings({ onClose, variant, initialSection }: SettingsProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SectionId>(
    resolveInitialSection(initialSection)
  );

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
            className="fixed left-1/2 top-1/2 z-40 flex h-[34rem] max-h-[85vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-[hsl(var(--border))] px-4 py-3">
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
            <div className="flex min-h-0 flex-1">
              <SettingsNav active={activeSection} onSelect={setActiveSection} className="w-44" />
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <SettingsPanel section={activeSection} />
              </div>
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
      <header className="flex shrink-0 items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2">
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

      <div className="flex min-h-0 flex-1">
        <SettingsNav active={activeSection} onSelect={setActiveSection} className="w-56" />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-2xl">
            <SettingsPanel section={activeSection} />
          </div>
        </main>
      </div>
    </div>
  );
}

function SettingsNav({
  active,
  onSelect,
  className
}: {
  active: SectionId;
  onSelect: (section: SectionId) => void;
  className?: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const buttonRefs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});

  function handleKeyDown(e: React.KeyboardEvent, index: number): void {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const direction = e.key === "ArrowDown" ? 1 : -1;
    const next = SECTIONS[(index + direction + SECTIONS.length) % SECTIONS.length];
    onSelect(next.id);
    buttonRefs.current[next.id]?.focus();
  }

  return (
    <nav
      aria-label={t("settings.navAriaLabel")}
      className={cn(
        "shrink-0 overflow-y-auto border-r border-[hsl(var(--border))] bg-[hsl(var(--surface-toolbar))] p-2",
        className
      )}
    >
      <div role="tablist" aria-orientation="vertical" className="space-y-0.5">
        {SECTIONS.map((section, index) => {
          const Icon = section.icon;
          const isActive = section.id === active;
          return (
            <button
              key={section.id}
              ref={(el) => {
                buttonRefs.current[section.id] = el;
              }}
              type="button"
              role="tab"
              id={`settings-tab-${section.id}`}
              aria-selected={isActive}
              aria-controls={`settings-panel-${section.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(section.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]",
                isActive
                  ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {t(section.labelKey)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Los tres paneles quedan siempre montados (ocultos con `hidden` + aria-hidden
// en vez de desmontarse) para que los controles de todas las secciones sigan
// presentes en el DOM — igual que antes del rediseño con pestañas, del cual
// dependen los tests e2e existentes (tests/e2e/settings.spec.ts).
function SettingsPanel({ section }: { section: SectionId }): React.JSX.Element {
  return (
    <>
      <GeneralPanel active={section === "general"} />
      <DiffEditorPanel active={section === "diffEditor"} />
      <AboutPanel active={section === "about"} />
    </>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }): React.JSX.Element {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{title}</h2>
      <p className="mt-1 text-sm text-[hsl(var(--text-muted))]">{description}</p>
    </div>
  );
}

function GeneralPanel({ active }: { active: boolean }): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { settings, updateSetting } = useAppSettings();

  return (
    <div
      id="settings-panel-general"
      role="tabpanel"
      aria-labelledby="settings-tab-general"
      aria-hidden={!active}
      className={cn(!active && "hidden")}
    >
      <SectionHeading title={t("settings.sectionGeneral")} description={t("settings.sectionGeneralDesc")} />

      <SettingRow label={t("settings.theme")} hint={t("settings.themeHint")} htmlFor="settings-theme">
        <select
          id="settings-theme"
          value={settings.theme}
          onChange={(e) => updateSetting("theme", e.target.value as "dark" | "light")}
          className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
        >
          <option value="dark">{t("settings.themeDark")}</option>
          <option value="light">{t("settings.themeLight")}</option>
        </select>
      </SettingRow>

      <Separator orientation="horizontal" />

      <SettingRow label={t("settings.language")} hint={t("settings.languageHint")} htmlFor="settings-language">
        <select
          id="settings-language"
          value={i18n.resolvedLanguage}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </SettingRow>

      <Separator orientation="horizontal" />

      <SettingRow
        label={t("settings.defaultViewMode")}
        hint={t("settings.defaultViewModeHint")}
        htmlFor="settings-default-view-mode"
      >
        <select
          id="settings-default-view-mode"
          value={settings.defaultViewMode}
          onChange={(e) =>
            updateSetting("defaultViewMode", e.target.value as "folders" | "files" | "blank")
          }
          className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
        >
          <option value="folders">{t("settings.defaultViewModeFolders")}</option>
          <option value="files">{t("settings.defaultViewModeFiles")}</option>
          <option value="blank">{t("settings.defaultViewModeBlank")}</option>
        </select>
      </SettingRow>
    </div>
  );
}

function DiffEditorPanel({ active }: { active: boolean }): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, updateSetting } = useAppSettings();

  return (
    <div
      id="settings-panel-diffEditor"
      role="tabpanel"
      aria-labelledby="settings-tab-diffEditor"
      aria-hidden={!active}
      className={cn(!active && "hidden")}
    >
      <SectionHeading
        title={t("settings.sectionDiffEditor")}
        description={t("settings.sectionDiffEditorDesc")}
      />

      <DiffPreview
        fontSize={settings.fontSize}
        minimapEnabled={settings.minimapEnabled}
        ignoreWhitespace={settings.ignoreWhitespace}
      />

      <SettingRow
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
          className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
        >
          <option value="advanced">Advanced</option>
          <option value="Myers">Myers</option>
          <option value="experimental">Experimental</option>
        </select>
      </SettingRow>

      <Separator orientation="horizontal" />

      <SettingRow label={t("settings.fontSize")} hint={t("settings.fontSizeHint")} htmlFor="settings-font-size">
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
          className="w-20 rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-app))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
        />
      </SettingRow>

      <Separator orientation="horizontal" />

      <ToggleRow
        label={t("settings.minimapEnabled")}
        hint={t("settings.minimapEnabledHint")}
        checked={settings.minimapEnabled}
        onChange={(v) => updateSetting("minimapEnabled", v)}
        id="settings-minimap"
      />

      <Separator orientation="horizontal" />

      <ToggleRow
        label={t("settings.ignoreWhitespace")}
        hint={t("settings.ignoreWhitespaceHint")}
        checked={settings.ignoreWhitespace}
        onChange={(v) => updateSetting("ignoreWhitespace", v)}
        id="settings-ignore-whitespace"
      />
    </div>
  );
}

type PreviewLineStatus = "same" | "changed" | "whitespace";

const PREVIEW_LEFT_LINES: { text: string; status: PreviewLineStatus }[] = [
  { text: "function f() {", status: "same" },
  { text: "  return a;", status: "changed" },
  { text: "  const x = 1;  ", status: "whitespace" },
  { text: "}", status: "same" }
];

const PREVIEW_RIGHT_LINES: { text: string; status: PreviewLineStatus }[] = [
  { text: "function f() {", status: "same" },
  { text: "  return a + 1;", status: "changed" },
  { text: "  const x = 1;", status: "whitespace" },
  { text: "}", status: "same" }
];

const PREVIEW_MINIMAP_BARS = [60, 40, 80, 30, 55];

function previewLineColor(
  status: PreviewLineStatus,
  side: "left" | "right",
  ignoreWhitespace: boolean
): string | undefined {
  if (status === "same") return undefined;
  if (status === "whitespace" && ignoreWhitespace) return undefined;
  const alpha = status === "changed" ? 0.18 : 0.09;
  // Colores semánticos de diff (rojo=eliminado, verde=agregado), independientes
  // del tema — igual que Monaco los renderiza en vs y vs-dark.
  return side === "left" ? `rgba(248, 81, 73, ${alpha})` : `rgba(46, 160, 67, ${alpha})`;
}

function DiffPreview({
  fontSize,
  minimapEnabled,
  ignoreWhitespace
}: {
  fontSize: number;
  minimapEnabled: boolean;
  ignoreWhitespace: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  // Evita que un tamaño de fuente grande rompa la miniatura.
  const previewFontSize = Math.min(fontSize, 16);

  return (
    <div
      className="mb-5 overflow-hidden rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-content))]"
      role="img"
      aria-label={t("settings.diffPreviewAriaLabel")}
    >
      <div className="flex items-center gap-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-toolbar))] px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[hsl(var(--text-faint))]" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
          {t("settings.diffPreviewLabel")}
        </span>
      </div>
      <div className="flex">
        <div
          className="grid flex-1 grid-cols-2 divide-x divide-[hsl(var(--border))] font-mono leading-snug"
          style={{ fontSize: previewFontSize }}
        >
          {(["left", "right"] as const).map((side) => (
            <div key={side} className="min-w-0 px-2 py-1.5">
              {(side === "left" ? PREVIEW_LEFT_LINES : PREVIEW_RIGHT_LINES).map((line, i) => (
                <div
                  key={i}
                  className="truncate rounded-sm px-1 text-[hsl(var(--text-secondary))]"
                  style={{ backgroundColor: previewLineColor(line.status, side, ignoreWhitespace) }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          ))}
        </div>
        {minimapEnabled && (
          <div
            className="flex w-3 shrink-0 flex-col items-center gap-1 border-l border-[hsl(var(--border))] bg-[hsl(var(--surface-toolbar))] py-2"
            aria-hidden="true"
          >
            {PREVIEW_MINIMAP_BARS.map((width, i) => (
              <span
                key={i}
                className="h-0.5 rounded-full bg-[hsl(var(--text-faint))]"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        )}
      </div>
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

function AboutPanel({ active }: { active: boolean }): React.JSX.Element {
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
    <div
      id="settings-panel-about"
      role="tabpanel"
      aria-labelledby="settings-tab-about"
      aria-hidden={!active}
      className={cn("space-y-4", !active && "hidden")}
    >
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
    </div>
  );
}

function SettingRow({
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
    <div className="flex items-center justify-between gap-6 py-3">
      <label className="flex-1 cursor-pointer" htmlFor={htmlFor}>
        <div className="text-sm text-[hsl(var(--foreground))]">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-[hsl(var(--text-muted))]">{hint}</div>}
      </label>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({
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
    <SettingRow label={label} hint={hint} htmlFor={id}>
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
    </SettingRow>
  );
}
