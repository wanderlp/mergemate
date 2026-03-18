import React, { useState, useCallback, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { FileTree } from './components/FileTree'
import { DiffViewer } from './components/DiffViewer'
import { ProgressBar } from './components/ProgressBar'
import { StatusBar } from './components/StatusBar'
import { useFolderScan } from './hooks/useFolderScan'
import { useFileDiff } from './hooks/useFileDiff'
import type { FileEntry } from './types'

export default function App(): React.JSX.Element {
  const {
    scanResult,
    scanning,
    progress,
    leftFolder,
    rightFolder,
    scan,
    openLeft,
    openRight,
    clear
  } = useFolderScan()

  const [hoveredPath, setHoveredPath] = useState('')

  const handleFileUpdated = useCallback(
    (_file: FileEntry) => {
      // Re-scan to update colors after merge
      scan()
    },
    [scan]
  )

  const {
    selectedFile,
    leftContent,
    rightContent,
    loading: diffLoading,
    openFile,
    closeFile,
    saveLeft,
    saveRight,
    copyToLeft,
    copyToRight
  } = useFileDiff(handleFileUpdated)

  // Auto-scan when both folders are set on first load
  useEffect(() => {
    if (leftFolder && rightFolder && !scanResult && !scanning) {
      scan()
    }
  }, [leftFolder, rightFolder]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'l') {
        e.preventDefault()
        openLeft()
      } else if (ctrl && e.key === 'r') {
        e.preventDefault()
        openRight()
      } else if (ctrl && e.key === 'F5') {
        e.preventDefault()
        scan()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openLeft, openRight, scan])

  const showEmpty = !scanResult && !scanning

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      {selectedFile ? (
        // Diff View
        <>
          {diffLoading ? (
            <div className="flex flex-1 items-center justify-center text-[#858585]">
              Cargando archivo…
            </div>
          ) : (
            <DiffViewer
              file={selectedFile}
              leftContent={leftContent}
              rightContent={rightContent}
              onBack={closeFile}
              onSaveLeft={saveLeft}
              onSaveRight={saveRight}
              onCopyToLeft={copyToLeft}
              onCopyToRight={copyToRight}
            />
          )}
          <StatusBar stats={scanResult?.stats ?? null} hoveredPath={hoveredPath} />
        </>
      ) : (
        // Folder Comparison View
        <>
          <Toolbar
            leftFolder={leftFolder}
            rightFolder={rightFolder}
            onOpenLeft={openLeft}
            onOpenRight={openRight}
            onRefresh={scan}
            onClear={clear}
            scanning={scanning}
          />

          <div className="relative flex flex-1 flex-col overflow-hidden">
            {scanning && progress && <ProgressBar progress={progress} />}

            {showEmpty ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-[#858585]">
                <div className="text-7xl">📂↔️📂</div>
                <div className="text-3xl font-bold text-[#cccccc]">MergeMate</div>
                <div className="text-sm">Abre dos carpetas para comenzar a comparar</div>
                <div className="mt-2 flex gap-4 text-sm text-[#aaaaaa]">
                  <span>Ctrl+L — Abrir izquierda</span>
                  <span>Ctrl+R — Abrir derecha</span>
                  <span>Ctrl+F5 — Actualizar</span>
                </div>
              </div>
            ) : (
              <FileTree
                entries={scanResult?.files ?? []}
                onFileOpen={openFile}
                onHover={setHoveredPath}
              />
            )}
          </div>

          <StatusBar stats={scanResult?.stats ?? null} hoveredPath={hoveredPath} />
        </>
      )}
    </div>
  )
}
