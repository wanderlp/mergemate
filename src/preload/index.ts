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

  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress): void => {
      callback(progress)
    }
    ipcRenderer.on('scan-progress', listener)
    return () => {
      ipcRenderer.removeListener('scan-progress', listener)
    }
  },

  readFileBase64: (filePath) =>
    ipcRenderer.invoke('read-file-base64', filePath),

  getLastFolders: () =>
    ipcRenderer.invoke('get-last-folders'),

  saveLastFolders: (left, right) =>
    ipcRenderer.invoke('save-last-folders', left, right),

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
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
