// Shared TypeScript interfaces between main and renderer

export interface RecentComparison {
  left: string
  right: string
  lastUsed: number
}

export type FileStatus = 'identical' | 'different' | 'comments-only' | 'left-only' | 'right-only'

export interface FileEntry {
  relativePath: string
  leftPath: string | null
  rightPath: string | null
  status: FileStatus
  isDirectory: boolean
  children?: FileEntry[]
  name: string
  extension: string
  leftSize: number | null
  rightSize: number | null
}

export interface ScanResult {
  files: FileEntry[]
  stats: ScanStats
}

export interface ScanStats {
  identical: number
  different: number
  commentsOnly: number
  leftOnly: number
  rightOnly: number
  total: number
}

export interface ScanProgress {
  percent: number
  currentFile: string
}

export interface ElectronAPI {
  scanFolder: (leftPath: string, rightPath: string) => Promise<ScanResult>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<void>
  copyFileWithBak: (src: string, dest: string) => Promise<void>
  showFolderDialog: () => Promise<string | null>
  getFileHash: (filePath: string) => Promise<string>
  readFileBase64: (filePath: string) => Promise<string>
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void
  folderExists: (path: string) => Promise<boolean>
  // Startup window
  getRecentComparisons: () => Promise<RecentComparison[]>
  openMainWindow: (left?: string, right?: string) => Promise<void>
  // Main window
  getPendingFolders: () => Promise<{ left: string; right: string } | null>
  saveRecentComparison: (left: string, right: string) => Promise<void>
  removeRecentComparison: (left: string, right: string) => Promise<void>
  // Window controls
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (callback: (maximized: boolean) => void) => () => void
  onCloseRequested: (callback: () => void) => () => void
  confirmClose: () => Promise<void>
  openExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
