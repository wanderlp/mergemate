import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  openLeft: () => void;
  swapFolders: () => Promise<void> | void;
  scan: () => Promise<void> | void;
  closeTab: () => void;
}

export function useGlobalShortcuts(handlers: ShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const h = handlersRef.current;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "l") {
        e.preventDefault();
        h.openLeft();
      } else if (ctrl && e.shiftKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        void h.swapFolders();
      } else if (ctrl && e.key === "F5") {
        e.preventDefault();
        void h.scan();
      } else if (e.key === "Escape") {
        h.closeTab();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
