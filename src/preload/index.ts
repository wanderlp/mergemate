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

  showFileDialog: (filter?) =>
    ipcRenderer.invoke('show-file-dialog', filter),

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

  openMainWindow: (left?, right?, mode?) =>
    ipcRenderer.invoke('startup-open-main', left, right, mode),

  // Main window
  getPendingFolders: () =>
    ipcRenderer.invoke('get-pending-folders'),

  getPendingFiles: () =>
    ipcRenderer.invoke('get-pending-files'),

  getPendingBlank: () =>
    ipcRenderer.invoke('get-pending-blank'),

  saveRecentComparison: (left, right, mode?) =>
    ipcRenderer.invoke('save-recent-comparison', left, right, mode),

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
  classifyFiles: (leftPath, rightPath, ext) => ipcRenderer.invoke('classify-files', leftPath, rightPath, ext),

  openExternal: (url) => ipcRenderer.invoke('open-external', url)
}

contextBridge.exposeInMainWorld('electronAPI', api)
