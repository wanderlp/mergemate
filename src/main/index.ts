import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { scanFolders } from './scanner'

interface WindowState {
  x: number | undefined
  y: number | undefined
  width: number
  height: number
  maximized: boolean
}

interface StoreSchema {
  lastLeftFolder: string | null
  lastRightFolder: string | null
  windowState: WindowState | null
}

const store = new Store<StoreSchema>()

function createWindow(): void {
  const savedState = store.get('windowState') ?? null

  const mainWindow = new BrowserWindow({
    x: savedState?.x,
    y: savedState?.y,
    width: savedState?.width ?? 1400,
    height: savedState?.height ?? 800,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    title: 'MergeMate (Liviano y de uso personal)',
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
    // Primera vez (sin estado guardado) → maximizar siempre
    // Con estado guardado → restaurar tal como lo dejó el usuario
    if (!savedState || savedState.maximized) {
      mainWindow.maximize()
    }
    mainWindow.show()
  })

  // Guardar estado al cerrar
  mainWindow.on('close', () => {
    const isMaximized = mainWindow.isMaximized()
    const bounds = mainWindow.getNormalBounds()
    store.set('windowState', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized: isMaximized
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // IPC: scan folders
  ipcMain.handle('scan-folder', async (_event, leftPath: string, rightPath: string) => {
    return new Promise((resolve, reject) => {
      try {
        const result = scanFolders(leftPath, rightPath, (percent, currentFile) => {
          mainWindow.webContents.send('scan-progress', { percent, currentFile })
        })
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  })

  // IPC: read file
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    return fs.readFileSync(filePath, 'utf-8')
  })

  // IPC: write file
  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, 'utf-8')
  })

  // IPC: copy file with .bak backup
  ipcMain.handle('copy-file-with-bak', async (_event, src: string, dest: string) => {
    if (fs.existsSync(dest)) {
      fs.copyFileSync(dest, dest + '.bak')
    }
    fs.copyFileSync(src, dest)
  })

  // IPC: show folder dialog
  ipcMain.handle('show-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // IPC: get file hash
  ipcMain.handle('get-file-hash', async (_event, filePath: string) => {
    const buf = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(buf).digest('hex')
  })

  // IPC: get last folders
  ipcMain.handle('get-last-folders', async () => {
    return {
      left: store.get('lastLeftFolder') ?? null,
      right: store.get('lastRightFolder') ?? null
    }
  })

  // IPC: save last folders
  ipcMain.handle('save-last-folders', async (_event, left: string, right: string) => {
    store.set('lastLeftFolder', left)
    store.set('lastRightFolder', right)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mergemate.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
