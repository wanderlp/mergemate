import React, { useState, useEffect } from "react";
import { Minus, X, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MergeMateLogo } from "./MergeMateLogo";

function MaximizeIcon(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="10" height="10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function RestoreIcon(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <rect x="2.5" y="0.5" width="8" height="8" stroke="currentColor" strokeWidth="1.2" />
      <rect
        x="0.5"
        y="2.5"
        width="8"
        height="8"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
      />
    </svg>
  );
}

const DRAG = { WebkitAppRegion: "drag" } as React.CSSProperties;
const NO_DRAG = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

interface TitleBarProps {
  showMaximize?: boolean;
  /**
   * Pantalla de origen desde la que se abre Settings via el boton de engranaje.
   * Root usa este valor para navegar de vuelta al cerrar Settings. Default
   * "main" porque App es el callsite por defecto; StartupScreen pasa "startup".
   */
  from?: "startup" | "main";
}

export function TitleBar({ showMaximize = true, from = "main" }: TitleBarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMaximized);
    return window.electronAPI.onMaximizeChange(setIsMaximized);
  }, []);

  return (
    <div
      role="banner"
      aria-label={t("titleBar.ariaLabel")}
      className="flex shrink-0 select-none items-center border-b bg-[hsl(var(--border))] bg-[hsl(var(--card))]"
      style={{ height: 40, ...DRAG }}
    >
      <div className="flex items-center gap-2.5 px-3">
        <MergeMateLogo size={32} />
        <span className="text-sm font-semibold tracking-wide text-[hsl(var(--foreground))]">
          MergeMate
        </span>
      </div>

      <div className="ml-auto flex h-full items-center" style={NO_DRAG}>
        {/* Botón de configuración */}
        <button
          type="button"
          onClick={() => {
            window.location.hash = `settings?from=${from}`;
          }}
          aria-label={t("settings.title")}
          title={t("settings.title")}
          tabIndex={-1}
          className="flex h-full items-center px-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] focus:outline-none"
        >
          <SettingsIcon size={14} aria-hidden="true" />
        </button>

        <button
          className="flex h-full w-[46px] items-center justify-center text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
          onClick={() => window.electronAPI.minimizeWindow()}
          aria-label={t("titleBar.minimize")}
          tabIndex={-1}
        >
          <Minus size={13} aria-hidden="true" />
        </button>

        {showMaximize && (
          <button
            className="flex h-full w-[46px] items-center justify-center text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
            onClick={() => window.electronAPI.maximizeWindow()}
            aria-label={isMaximized ? t("titleBar.restore") : t("titleBar.maximize")}
            tabIndex={-1}
          >
            {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
          </button>
        )}

        <button
          className="flex h-full w-[46px] items-center justify-center text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--text-inverse))]"
          onClick={() => window.electronAPI.closeWindow()}
          aria-label={t("titleBar.close")}
          tabIndex={-1}
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
