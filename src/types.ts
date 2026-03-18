// Shared TypeScript interfaces between main and renderer

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
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void
  getLastFolders: () => Promise<{ left: string | null; right: string | null }>
  saveLastFolders: (left: string, right: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
