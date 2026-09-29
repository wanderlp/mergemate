import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import * as path from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { autoUpdater } from "electron-updater";
import Store from "electron-store";
import * as fs from "fs";
import { scanFolders } from "./scanner";
import { hashFile, classifyFiles } from "./classifier";
import type { RecentComparison, ScanResult, SerializableTab } from "../types";
import { serializeCsv, serializeJson, serializeMarkdown, type ExportFormat } from "./services/export.service";

interface WindowState {
  x: number | undefined;
  y: number | undefined;
  width: number;
  height: number;
  maximized: boolean;
}

interface StoreSchema {
  recentComparisons: RecentComparison[];
  windowState: WindowState | null;
  appSettings: {
    theme: "dark" | "light";
    diffViewMode: "side-by-side" | "inline";
    diffAlgorithm: "advanced" | "Myers" | "experimental";
    minimapEnabled: boolean;
    fontSize: number;
    ignoreWhitespace: boolean;
    defaultViewMode: "folders" | "files" | "blank";
  };
  lastSession: {
    leftFolder: string;
    rightFolder: string;
    lastUsed: number;
    openTabs: SerializableTab[];
  };
}

const DEFAULT_SETTINGS: StoreSchema["appSettings"] = {
  theme: "dark",
  diffViewMode: "side-by-side",
  diffAlgorithm: "advanced",
  minimapEnabled: true,
  fontSize: 15,
  ignoreWhitespace: false,
  defaultViewMode: "folders"
};

const DEFAULT_LAST_SESSION: StoreSchema["lastSession"] = {
  leftFolder: "",
  rightFolder: "",
  lastUsed: 0,
  openTabs: []
};

const store = new Store<StoreSchema>({
  defaults: {
    appSettings: DEFAULT_SETTINGS,
    lastSession: DEFAULT_LAST_SESSION
  }
});

let startupWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let pendingFolders: { left: string; right: string } | null = null;
let pendingFiles: { left: string; right: string } | null = null;
let pendingBlank = false;
let mainWindowClosing = false;

// Paths autorizados para escritura. Vacío = rechazar todo (caso blank, antes
// de cualquier scan). Se setea en `scan-folder` (modo carpetas) y en
// `startup-open-main` con mode="files" (archivos individuales), y se resetea
// al cerrar la mainWindow. La validación con symlinks resuelve el caso donde
// `leftFolder` está dentro de un symlink de sistema (p.ej. /tmp → /private/tmp
// en macOS).
let authorizedRoots: string[] = [];

function setupMaximizeEvents(win: BrowserWindow): void {
  win.on("maximize", () => win.webContents.send("window-maximize-change", true));
  win.on("unmaximize", () => win.webContents.send("window-maximize-change", false));
}

function createStartupWindow(): void {
  startupWindow = new BrowserWindow({
    width: 900,
    height: 600,
    resizable: false,
    maximizable: false,
    center: true,
    show: false,
    frame: false,
    icon: join(__dirname, "../../resources/icon.ico"),
    title: "MergeMate",
    backgroundColor: "#1e1e1e",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  startupWindow.on("ready-to-show", () => startupWindow?.show());

  // Si el usuario cierra la startup sin haber abierto main → salir
  startupWindow.on("close", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      app.quit();
    }
  });

  setupMaximizeEvents(startupWindow);

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    startupWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + "#startup");
  } else {
    startupWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: "startup" });
  }
}

const SAFE_EXTERNAL_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

function safeOpenExternal(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      console.error(`[main] openExternal blocked: protocol ${parsed.protocol}`);
      return false;
    }
    shell.openExternal(url);
    return true;
  } catch (err) {
    console.error(`[main] openExternal blocked: invalid URL ${url}`, err);
    return false;
  }
}

function safeWriteFile(filePath: string, content: string): void {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, content, "utf-8");
  fs.renameSync(tmp, filePath);
}

function safeCopyFileWithBak(src: string, dest: string): void {
  const bak = dest + ".bak";
  if (fs.existsSync(dest)) {
    try {
      fs.copyFileSync(dest, bak, fs.constants.COPYFILE_EXCL);
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code !== "EEXIST") {
        throw new Error(`Failed to create backup at ${bak}: ${err}`);
      }
      // .bak ya existe de una copia anterior: lo conservamos como respaldo
      // histórico. Si el copy principal falla, restauramos desde este .bak.
    }
  }
  try {
    fs.copyFileSync(src, dest);
  } catch (err) {
    if (fs.existsSync(bak)) {
      try {
        fs.copyFileSync(bak, dest);
      } catch (restoreErr) {
        throw new Error(`Copy failed and restore from ${bak} also failed: ${err} | ${restoreErr}`);
      }
    }
    throw err;
  }
}

// Resuelve symlinks de un path. Si el path no existe (caso normal al escribir
// un archivo nuevo), resuelve el directorio padre y reconstruye el path completo.
function realPathOrParent(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    const parent = path.dirname(p);
    try {
      return path.join(fs.realpathSync(parent), path.basename(p));
    } catch {
      return p;
    }
  }
}

function isPathInsideAnyRoot(filePath: string, roots: string[]): boolean {
  if (roots.length === 0) return false;
  const realFile = realPathOrParent(path.resolve(filePath));
  return roots.some((root) => {
    const realRoot = realPathOrParent(path.resolve(root));
    const withSep = realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep;
    return realFile === realRoot || realFile.startsWith(withSep);
  });
}

function createMainWindow(): void {
  const savedState = store.get("windowState") ?? null;

  mainWindow = new BrowserWindow({
    x: savedState?.x,
    y: savedState?.y,
    width: savedState?.width ?? 1400,
    height: savedState?.height ?? 800,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    frame: false,
    icon: join(__dirname, "../../resources/icon.ico"),
    title: "MergeMate",
    backgroundColor: "#1e1e1e",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("ready-to-show", () => {
    if (!savedState || savedState.maximized) {
      mainWindow?.maximize();
    }
    mainWindow?.show();
  });

  mainWindow.on("close", (event) => {
    if (!mainWindow) return;
    // Guardar estado siempre (antes de cualquier decisión)
    const isMaximized = mainWindow.isMaximized();
    const bounds = mainWindow.getNormalBounds();
    store.set("windowState", {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized: isMaximized
    });
    // Pedir confirmación al renderer (solo la primera vez)
    if (!mainWindowClosing) {
      event.preventDefault();
      mainWindow.webContents.send("window-close-requested");
    }
  });

  mainWindow.on("closed", () => {
    authorizedRoots = [];
    mainWindow = null;
    mainWindowClosing = false;
    createStartupWindow();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    safeOpenExternal(details.url);
    return { action: "deny" };
  });

  setupMaximizeEvents(mainWindow);

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + "#main");
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: "main" });
  }
}

function registerIpcHandlers(): void {
  // ── Startup ───────────────────────────────────────────────────────────────

  ipcMain.handle("startup-get-recent", () => store.get("recentComparisons") ?? []);

  ipcMain.handle("startup-open-main", (_event, left?: string, right?: string, mode?: string) => {
    if (mode === "blank") {
      pendingBlank = true;
      authorizedRoots = [];
    } else if (left && right) {
      // Si el mode no viene explícito, detectar por el sistema de archivos
      const effectiveMode =
        mode === "files" ||
        (mode !== "folders" && fs.existsSync(left) && fs.statSync(left).isFile())
          ? "files"
          : "folders";

      if (effectiveMode === "files") {
        const assertFile = (p: string, side: "left" | "right"): void => {
          if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
            console.error(`[startup-open-main] invalid file path for ${side}: ${p}`);
            throw new Error(`Invalid file path for ${side}: ${p}`);
          }
        };
        assertFile(left, "left");
        assertFile(right, "right");
        pendingFiles = { left, right };
        // Modo files: autorizar los archivos individuales (no carpetas).
        authorizedRoots = [path.resolve(left), path.resolve(right)];
      } else {
        pendingFolders = { left, right };
        // Modo folders: no autorizamos acá — se autoriza al ejecutar scan-folder.
      }
    }
    createMainWindow();
    startupWindow?.close();
  });

  // ── Main window ───────────────────────────────────────────────────────────

  ipcMain.handle("get-pending-folders", () => {
    const f = pendingFolders;
    pendingFolders = null;
    return f;
  });

  ipcMain.handle("get-pending-files", () => {
    const f = pendingFiles;
    pendingFiles = null;
    return f;
  });

  ipcMain.handle("get-pending-blank", () => {
    const b = pendingBlank;
    pendingBlank = false;
    return b;
  });

  ipcMain.handle("show-file-dialog", async (event, filter?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const imageExts = [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "bmp",
      "ico",
      "tiff",
      "tif",
      "webp",
      "avif",
      "svg"
    ];
    const result = await dialog.showOpenDialog(win ?? startupWindow!, {
      properties: ["openFile"],
      filters: filter === "images-only" ? [{ name: "Imágenes", extensions: imageExts }] : undefined
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(
    "save-recent-comparison",
    (_event, left: string, right: string, mode?: "folders" | "files") => {
      const existing: RecentComparison[] = store.get("recentComparisons") ?? [];
      const filtered = existing.filter((r) => r.left !== left || r.right !== right);
      store.set(
        "recentComparisons",
        [{ left, right, lastUsed: Date.now(), mode }, ...filtered].slice(0, 8)
      );
    }
  );

  ipcMain.handle("remove-recent-comparison", (_event, left: string, right: string) => {
    const existing: RecentComparison[] = store.get("recentComparisons") ?? [];
    store.set(
      "recentComparisons",
      existing.filter((r) => r.left !== left || r.right !== right)
    );
  });

  // ── File operations ───────────────────────────────────────────────────────

  let scanController: AbortController | null = null;

  ipcMain.handle("scan-folder", async (event, leftPath: string, rightPath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    scanController?.abort();
    scanController = new AbortController();
    const signal = scanController.signal;
    // El usuario autorizó estas carpetas para escritura; el handler `write-file`
    // las usará como allowlist hasta que la mainWindow se cierre o se escaneen
    // otras carpetas.
    authorizedRoots = [path.resolve(leftPath), path.resolve(rightPath)];
    try {
      const result = await scanFolders(leftPath, rightPath, (percent, currentFile) => {
        win?.webContents.send("scan-progress", { percent, currentFile });
      }, signal);
      return result;
    } finally {
      if (scanController?.signal === signal) scanController = null;
    }
  });

  ipcMain.handle("cancel-scan", () => {
    scanController?.abort();
    scanController = null;
  });

  ipcMain.handle("read-file", async (_event, filePath: string) =>
    fs.readFileSync(filePath, "utf-8")
  );

  ipcMain.handle("read-file-base64", async (_event, filePath: string) =>
    fs.readFileSync(filePath).toString("base64")
  );

  ipcMain.handle("write-file", async (_event, filePath: string, content: string) => {
    if (!isPathInsideAnyRoot(filePath, authorizedRoots)) {
      throw new Error(
        `write-file rejected: "${filePath}" is outside authorized roots (${authorizedRoots.join(", ") || "<none>"})`
      );
    }
    safeWriteFile(filePath, content);
  });

  ipcMain.handle("copy-file-with-bak", async (_event, src: string, dest: string) => {
    // El destino es donde escribe safeCopyFileWithBak (crea dest.bak y luego
    // copia src a dest). Un renderer comprometido puede invocar este handler
    // con un dest arbitrario fuera de las carpetas autorizadas, evitando
    // por completo la proteccion que si existe para write-file.
    // NO validamos src: el renderer ya lee paths arbitrarios via readFile/
    // getFileHash/classifyFiles sin validacion adicional (ver JSDoc de preload).
    if (!isPathInsideAnyRoot(dest, authorizedRoots)) {
      throw new Error(
        `copy-file-with-bak rejected: "${dest}" is outside authorized roots (${authorizedRoots.join(", ") || "<none>"})`
      );
    }
    safeCopyFileWithBak(src, dest);
  });

  ipcMain.handle("show-folder-dialog", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win ?? mainWindow!, {
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("get-file-hash", async (_event, filePath: string) => hashFile(filePath));

  ipcMain.handle(
    "classify-files",
    (_event, leftPath: string | null, rightPath: string | null, ext: string) =>
      classifyFiles(leftPath, rightPath, ext)
  );

  ipcMain.handle(
    "folder-exists",
    (_event, folderPath: string) =>
      fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()
  );

  ipcMain.handle("open-external", (_event, url: string) => {
    if (!safeOpenExternal(url)) {
      throw new Error(`Protocol not allowed for openExternal`);
    }
  });

  // ── Export ───────────────────────────────────────────────────────────────

  ipcMain.handle("export-scan", async (event, format: ExportFormat, result: ScanResult) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const ext = format === "csv" ? "csv" : format === "json" ? "json" : "md";
    const defaultName = `mergemate-${new Date().toISOString().slice(0, 10)}.${ext}`;
    const saveResult = await dialog.showSaveDialog(win ?? mainWindow!, {
      title: "Exportar resultado",
      defaultPath: defaultName,
      filters: [
        format === "csv"
          ? { name: "CSV", extensions: ["csv"] }
          : format === "json"
            ? { name: "JSON", extensions: ["json"] }
            : { name: "Markdown", extensions: ["md"] }
      ]
    });
    if (saveResult.canceled || !saveResult.filePath) return { canceled: true };
    const content =
      format === "csv"
        ? serializeCsv(result)
        : format === "json"
          ? serializeJson(result)
          : serializeMarkdown(result);
    safeWriteFile(saveResult.filePath, content);
    return { canceled: false, filePath: saveResult.filePath };
  });

  // ── App settings ──────────────────────────────────────────────────────────

  ipcMain.handle("app-settings-get", () => store.get("appSettings") ?? DEFAULT_SETTINGS);

  ipcMain.handle("app-settings-set", (_event, partial: Partial<StoreSchema["appSettings"]>) => {
    const current = store.get("appSettings") ?? DEFAULT_SETTINGS;
    const next = { ...current, ...partial };
    store.set("appSettings", next);
    return next;
  });

  ipcMain.handle("session-get", () => {
    // Merge con defaults: datos viejos en disco pueden no tener `lastUsed`,
    // en cuyo caso `lastUsed: 0` filtra la sesión por edad (correcto: no
    // queremos restaurar sesiones pre-fix sin timestamp).
    const stored = store.get("lastSession");
    const session = { ...DEFAULT_LAST_SESSION, ...stored };
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    if (session.lastUsed && Date.now() - session.lastUsed > SEVEN_DAYS_MS) {
      return null;
    }
    return session;
  });

  ipcMain.handle("session-save", (_event, partial: Partial<StoreSchema["lastSession"]>) => {
    const current = store.get("lastSession") ?? DEFAULT_LAST_SESSION;
    // Cualquier session-save actualiza `lastUsed` automaticamente. Asi no
    // depende de que el renderer recuerde setear el timestamp.
    const next = { ...current, ...partial, lastUsed: Date.now() };
    store.set("lastSession", next);
    return next;
  });

  ipcMain.handle("window-confirm-close", () => {
    mainWindowClosing = true;
    mainWindow?.close();
  });

  // ── Window controls (funciona para cualquier ventana via event.sender) ────

  ipcMain.handle("window-minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle("window-maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });

  ipcMain.handle("window-close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle(
    "window-is-maximized",
    (event) => BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  );
}

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-downloaded", () => {
    const win = mainWindow ?? startupWindow;
    if (!win) return;
    dialog
      .showMessageBox(win, {
        type: "info",
        title: "Actualización lista",
        message: "Se descargó una nueva versión de MergeMate.",
        detail: "¿Deseas reiniciar ahora para aplicar la actualización?",
        buttons: ["Reiniciar ahora", "Más tarde"],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
  });

  autoUpdater.on("error", (err) => {
    console.error("[MergeMate updater]", err);
  });

  autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.mergemate.app");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerIpcHandlers();
  createStartupWindow();

  if (!is.dev) setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createStartupWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
