import { useState, useCallback, useEffect, useRef } from 'react'
import type { ScanResult, ScanProgress } from '../types'

interface UseFolderScanReturn {
  scanResult: ScanResult | null
  scanning: boolean
  progress: ScanProgress | null
  leftFolder: string
  rightFolder: string
  setLeftFolder: (path: string) => void
  setRightFolder: (path: string) => void
  scan: () => Promise<void>
  openLeft: () => Promise<void>
  openRight: () => Promise<void>
  clear: () => void
}

export function useFolderScan(): UseFolderScanReturn {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const [leftFolder, setLeftFolder] = useState('')
  const [rightFolder, setRightFolder] = useState('')
  const autoScanRef = useRef(false)

  useEffect(() => {
    // Leer carpetas pendientes (seleccionadas desde la startup screen)
    window.electronAPI.getPendingFolders().then((pending) => {
      if (pending?.left)  setLeftFolder(pending.left)
      if (pending?.right) setRightFolder(pending.right)
      if (pending?.left && pending?.right) {
        autoScanRef.current = true
      }
    })

    const unsubscribe = window.electronAPI.onScanProgress((p) => {
      setProgress(p)
    })
    return unsubscribe
  }, [])

  const scan = useCallback(async () => {
    if (!leftFolder || !rightFolder) return
    setScanning(true)
    setProgress({ percent: 0, currentFile: '' })
    try {
      await window.electronAPI.saveRecentComparison(leftFolder, rightFolder)
      const result = await window.electronAPI.scanFolder(leftFolder, rightFolder)
      setScanResult(result)
    } finally {
      setScanning(false)
      setProgress(null)
    }
  }, [leftFolder, rightFolder])

  // Auto-scan cuando se cargan carpetas desde recientes
  useEffect(() => {
    if (autoScanRef.current && leftFolder && rightFolder) {
      autoScanRef.current = false
      scan()
    }
  }, [leftFolder, rightFolder, scan])

  const openLeft = useCallback(async () => {
    const folder = await window.electronAPI.showFolderDialog()
    if (folder) setLeftFolder(folder)
  }, [])

  const openRight = useCallback(async () => {
    const folder = await window.electronAPI.showFolderDialog()
    if (folder) setRightFolder(folder)
  }, [])

  const clear = useCallback(() => {
    setLeftFolder('')
    setRightFolder('')
    setScanResult(null)
    setProgress(null)
  }, [])

  return {
    scanResult,
    scanning,
    progress,
    leftFolder,
    rightFolder,
    setLeftFolder,
    setRightFolder,
    scan,
    openLeft,
    openRight,
    clear
  }
}
