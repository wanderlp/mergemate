import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, ScanProgress } from '../types'

const api: ElectronAPI = {
  scanFolder: (leftPath, rightPath) =>
    ipcRenderer.invoke('scan-folder', leftPath, rightPath),

  readFile: (filePath) =>
    ipcRenderer.invoke('read-file', filePath),

  writeFile: (filePath, content) =>
    ipcRenderer.invoke('write-file', filePath, content),

  copyFileWithBak: (src, dest) =>
    ipcRenderer.invoke('copy-file-with-bak', src, dest),

  showFolderDialog: () =>
    ipcRenderer.invoke('show-folder-dialog'),

  getFileHash: (filePath) =>
    ipcRenderer.invoke('get-file-hash', filePath),

  readFileBase64: (filePath) =>
    ipcRenderer.invoke('read-file-base64', filePath),

  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress): void => {
      callback(progress)
    }
    ipcRenderer.on('scan-progress', listener)
    return () => {
      ipcRenderer.removeListener('scan-progress', listener)
    }
  },

  // Startup window
  getRecentComparisons: () =>
    ipcRenderer.invoke('startup-get-recent'),

  openMainWindow: (left?, right?) =>
    ipcRenderer.invoke('startup-open-main', left, right),

  // Main window
  getPendingFolders: () =>
    ipcRenderer.invoke('get-pending-folders'),

  saveRecentComparison: (left, right) =>
    ipcRenderer.invoke('save-recent-comparison', left, right),

  removeRecentComparison: (left, right) =>
    ipcRenderer.invoke('remove-recent-comparison', left, right),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow:    () => ipcRenderer.invoke('window-close'),
  isMaximized:    () => ipcRenderer.invoke('window-is-maximized'),

  onMaximizeChange: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, maximized: boolean): void => {
      callback(maximized)
    }
    ipcRenderer.on('window-maximize-change', listener)
    return () => ipcRenderer.removeListener('window-maximize-change', listener)
  },

  onCloseRequested: (callback) => {
    const listener = (): void => callback()
    ipcRenderer.on('window-close-requested', listener)
    return () => ipcRenderer.removeListener('window-close-requested', listener)
  },

  confirmClose: () => ipcRenderer.invoke('window-confirm-close'),

  folderExists: (path) => ipcRenderer.invoke('folder-exists', path),

  openExternal: (url) => ipcRenderer.invoke('open-external', url)
}

contextBridge.exposeInMainWorld('electronAPI', api)
