import type { ReactNode } from "react";
import { SettingsProvider } from "./hooks/useAppSettings";
import { TooltipProvider } from "./components/ui/tooltip";

/**
 * Agrupa todos los context providers globales de la app (settings, tooltips, etc.).
 * Cada punto de entrada del renderer (main.tsx: App, StartupScreen, Settings) es un
 * root de React independiente, así que cada uno necesita su propia instancia de
 * estos providers — no se pueden compartir entre roots distintos.
 */
export function AppProviders({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <SettingsProvider>
      <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
    </SettingsProvider>
  );
}
