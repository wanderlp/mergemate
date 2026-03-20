import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import * as fs from 'fs'
import { scanFolders } from './scanner'
import { hashFile } from './classifier'
import type { RecentComparison } from '../types'

interface WindowState {
  x: number | undefined
  y: number | undefined
  width: number
  height: number
  maximized: boolean
}

interface StoreSchema {
  recentComparisons: RecentComparison[]
  windowState: WindowState | null
}

const store = new Store<StoreSchema>()

let startupWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null
let pendingFolders: { left: string; right: string } | null = null
let mainWindowClosing = false

function setupMaximizeEvents(win: BrowserWindow): void {
  win.on('maximize',   () => win.webContents.send('window-maximize-change', true))
  win.on('unmaximize', () => win.webContents.send('window-maximize-change', false))
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
    icon: join(__dirname, '../../resources/icon.ico'),
    title: 'MergeMate',
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  startupWindow.on('ready-to-show', () => startupWindow?.show())

  // Si el usuario cierra la startup sin haber abierto main → salir
  startupWindow.on('close', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      app.quit()
    }
  })

  setupMaximizeEvents(startupWindow)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    startupWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#startup')
  } else {
    startupWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'startup' })
  }
}

function createMainWindow(): void {
  const savedState = store.get('windowState') ?? null

  mainWindow = new BrowserWindow({
    x: savedState?.x,
    y: savedState?.y,
    width: savedState?.width ?? 1400,
    height: savedState?.height ?? 800,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    frame: false,
    icon: join(__dirname, '../../resources/icon.ico'),
    title: 'MergeMate',
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (!savedState || savedState.maximized) {
      mainWindow?.maximize()
    }
    mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (!mainWindow) return
    // Guardar estado siempre (antes de cualquier decisión)
    const isMaximized = mainWindow.isMaximized()
    const bounds = mainWindow.getNormalBounds()
    store.set('windowState', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized: isMaximized
    })
    // Pedir confirmación al renderer (solo la primera vez)
    if (!mainWindowClosing) {
      event.preventDefault()
      mainWindow.webContents.send('window-close-requested')
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    mainWindowClosing = false
    createStartupWindow()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  setupMaximizeEvents(mainWindow)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#main')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'main' })
  }
}

function registerIpcHandlers(): void {
  // ── Startup ───────────────────────────────────────────────────────────────

  ipcMain.handle('startup-get-recent', () =>
    store.get('recentComparisons') ?? []
  )

  ipcMain.handle('startup-open-main', (_event, left?: string, right?: string) => {
    if (left && right) pendingFolders = { left, right }
    createMainWindow()
    startupWindow?.close()
  })

  // ── Main window ───────────────────────────────────────────────────────────

  ipcMain.handle('get-pending-folders', () => {
    const f = pendingFolders
    pendingFolders = null
    return f
  })

  ipcMain.handle('save-recent-comparison', (_event, left: string, right: string) => {
    const existing: RecentComparison[] = store.get('recentComparisons') ?? []
    const filtered = existing.filter((r) => r.left !== left || r.right !== right)
    store.set('recentComparisons', [{ left, right, lastUsed: Date.now() }, ...filtered].slice(0, 8))
  })

  // ── File operations ───────────────────────────────────────────────────────

  ipcMain.handle('scan-folder', async (event, leftPath: string, rightPath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return new Promise((resolve, reject) => {
      try {
        const result = scanFolders(leftPath, rightPath, (percent, currentFile) => {
          win?.webContents.send('scan-progress', { percent, currentFile })
        })
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  })

  ipcMain.handle('read-file', async (_event, filePath: string) =>
    fs.readFileSync(filePath, 'utf-8')
  )

  ipcMain.handle('read-file-base64', async (_event, filePath: string) =>
    fs.readFileSync(filePath).toString('base64')
  )

  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, 'utf-8')
  })

  ipcMain.handle('copy-file-with-bak', async (_event, src: string, dest: string) => {
    if (fs.existsSync(dest)) fs.copyFileSync(dest, dest + '.bak')
    fs.copyFileSync(src, dest)
  })

  ipcMain.handle('show-folder-dialog', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win ?? mainWindow!, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('get-file-hash', async (_event, filePath: string) =>
    hashFile(filePath)
  )

  ipcMain.handle('window-confirm-close', () => {
    mainWindowClosing = true
    mainWindow?.close()
  })

  // ── Window controls (funciona para cualquier ventana via event.sender) ────

  ipcMain.handle('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.isMaximized() ? win.unmaximize() : win.maximize()
  })

  ipcMain.handle('window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window-is-maximized', (event) =>
    BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  )
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mergemate.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createStartupWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createStartupWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
