import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { ElectronAPI, ScanProgress } from "../types";

/**
 * API expuesta al renderer via `contextBridge`. Cada método es un wrapper
 * 1-a-1 sobre un `ipcRenderer.invoke` (o `on`+`removeListener` para eventos).
 *
 * Contratos de seguridad en el main process (`src/main/index.ts`):
 *
 * - `writeFile`: rechaza paths que no estén dentro de las carpetas autorizadas
 *   de la sesión actual (leftFolder/rightFolder en modo carpetas, o los
 *   archivos individuales en modo files).
 * - `openExternal`: solo acepta URLs con protocolo https/http/mailto. Cualquier
 *   otro protocolo (file:, javascript:, etc.) lanza Error.
 * - `exportScan`: el path destino lo elige el usuario via dialog nativo, no el
 *   renderer — por eso no pasa por la validación de writeFile.
 * - `copyFileWithBak`: el path destino debe estar dentro de las carpetas
 *   autorizadas de la sesión actual (leftFolder/rightFolder en modo carpetas,
 *   o los archivos individuales en modo files). Si el destino está fuera, el
 *   main process rechaza con Error. Crea un .bak previo (preservando uno
 *   existente via COPYFILE_EXCL) y hace rollback automático desde .bak si el
 *   copy principal falla.
 * - `readFile`, `readFileBase64`, `getFileHash`, `folderExists`, `classifyFiles`:
 *   leen del filesystem pero no escriben. Sin validación adicional porque el
 *   renderer solo lee archivos dentro de carpetas que el propio usuario
 *   seleccionó via `scanFolder` o `getPendingFiles`/`getPendingFolders`.
 */
const api: ElectronAPI = {
  /** Escanea dos carpetas y devuelve los archivos comparables. Cancela cualquier scan anterior. */
  scanFolder: (leftPath, rightPath) => ipcRenderer.invoke("scan-folder", leftPath, rightPath),
  /** Aborta el scan en curso (si lo hay). */
  cancelScan: () => ipcRenderer.invoke("cancel-scan"),

  /** Lee un archivo como UTF-8. Usado por DiffViewer para mostrar el contenido. */
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),

  /**
   * Escribe contenido UTF-8 de forma atómica (tmp + rename). El main process
   * rechaza con Error si el path no está dentro de las carpetas autorizadas
   * de la sesión.
   */
  writeFile: (filePath, content) => ipcRenderer.invoke("write-file", filePath, content),

  /**
   * Copia src → dest con backup automático: crea dest.bak antes (preservando
   * uno existente via COPYFILE_EXCL), y restaura desde .bak si el copy falla.
   */
  copyFileWithBak: (src, dest) => ipcRenderer.invoke("copy-file-with-bak", src, dest),

  /** Abre un dialog nativo para elegir una carpeta. */
  showFolderDialog: () => ipcRenderer.invoke("show-folder-dialog"),

  /** Abre un dialog nativo para elegir un archivo. `filter: "images-only"` filtra por extensiones de imagen. */
  showFileDialog: (filter?) => ipcRenderer.invoke("show-file-dialog", filter),

  /** Devuelve el hash SHA-256 del archivo (hex). Usado por el clasificador. */
  getFileHash: (filePath) => ipcRenderer.invoke("get-file-hash", filePath),

  /** Lee un archivo binario y lo devuelve como base64. Usado por el visor de imágenes. */
  readFileBase64: (filePath) => ipcRenderer.invoke("read-file-base64", filePath),

  /** Suscribe a eventos de progreso de scan. Retorna función de cleanup. */
  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress): void => {
      callback(progress);
    };
    ipcRenderer.on("scan-progress", listener);
    return () => {
      ipcRenderer.removeListener("scan-progress", listener);
    };
  },

  // Startup window
  /** Lista las comparaciones recientes persistidas en electron-store. */
  getRecentComparisons: () => ipcRenderer.invoke("startup-get-recent"),

  /**
   * Abre la mainWindow con las carpetas/archivos seleccionados. `mode` puede
   * ser "folders", "files" o "blank". El main process autorizará los paths
   * correspondientes para escritura en `writeFile`.
   */
  openMainWindow: (left?, right?, mode?) =>
    ipcRenderer.invoke("startup-open-main", left, right, mode),

  // Main window
  /** Lee y limpia las carpetas pendientes (seteadas por startup-open-main con mode="folders"). */
  getPendingFolders: () => ipcRenderer.invoke("get-pending-folders"),

  /** Lee y limpia los archivos pendientes (seteados por startup-open-main con mode="files"). */
  getPendingFiles: () => ipcRenderer.invoke("get-pending-files"),

  /** Lee y limpia el flag de blank tab (seteado por startup-open-main con mode="blank"). */
  getPendingBlank: () => ipcRenderer.invoke("get-pending-blank"),

  /** Persiste una entrada en el historial de recientes (máximo 8, sin duplicados). */
  saveRecentComparison: (left, right, mode?) =>
    ipcRenderer.invoke("save-recent-comparison", left, right, mode),

  /** Elimina una entrada del historial de recientes. */
  removeRecentComparison: (left, right) =>
    ipcRenderer.invoke("remove-recent-comparison", left, right),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  /** Suscribe a cambios de maximize/unmaximize de la ventana. Retorna función de cleanup. */
  onMaximizeChange: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, maximized: boolean): void => {
      callback(maximized);
    };
    ipcRenderer.on("window-maximize-change", listener);
    return () => ipcRenderer.removeListener("window-maximize-change", listener);
  },

  /** Suscribe al evento de cierre solicitado (cuando el usuario hace click en la X). Retorna función de cleanup. */
  onCloseRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on("window-close-requested", listener);
    return () => ipcRenderer.removeListener("window-close-requested", listener);
  },

  /** Confirma el cierre de la mainWindow saltándose el diálogo "¿Cerrar comparación?". */
  confirmClose: () => ipcRenderer.invoke("window-confirm-close"),

  /** Verifica si la ruta existe y es un directorio. */
  folderExists: (path) => ipcRenderer.invoke("folder-exists", path),
  /** Clasifica un par de archivos (left/right) según su estado de comparación. */
  classifyFiles: (leftPath, rightPath, ext) =>
    ipcRenderer.invoke("classify-files", leftPath, rightPath, ext),

  /**
   * Abre una URL en el navegador del SO. Solo acepta https/http/mailto.
   * Otros protocolos (file:, javascript:, etc.) lanzan Error.
   */
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  /** Exporta el resultado del scan a CSV/JSON/Markdown via dialog nativo de save. */
  exportScan: (format, result) => ipcRenderer.invoke("export-scan", format, result),

  /** Resuelve la ruta absoluta de un File del DOM (reemplazo de File.path deprecado). */
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  /** Lee la configuración persistente de la app (theme, diff algorithm, etc). */
  getAppSettings: () => ipcRenderer.invoke("app-settings-get"),
  /** Actualiza parcialmente la configuración y persiste. */
  setAppSettings: (partial) => ipcRenderer.invoke("app-settings-set", partial),

  /** Lee la última sesión (leftFolder/rightFolder) para auto-reabrir. */
  getLastSession: () => ipcRenderer.invoke("session-get"),
  /** Persiste la sesión actual para restaurar en el siguiente arranque. */
  setLastSession: (partial) => ipcRenderer.invoke("session-save", partial),

  /** Version de la app, plataforma, versiones de Electron/Node/Chrome y ruta del archivo de configuración. Usado en Settings > Acerca de. */
  getSystemInfo: () => ipcRenderer.invoke("get-system-info")
};

contextBridge.exposeInMainWorld("electronAPI", api);
