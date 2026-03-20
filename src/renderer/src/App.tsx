import React, { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { TooltipProvider } from './components/ui/tooltip'
import { COMPARISON_TAB_ID } from './constants'
import { MergeMateLogo } from './components/MergeMateLogo'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'
import { FileTree } from './components/FileTree'
import { DiffViewer } from './components/DiffViewer'
import { ImageViewer } from './components/ImageViewer'
import { ProgressBar } from './components/ProgressBar'
import { StatusBar } from './components/StatusBar'
import type { StatusInfo, ImageDims } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import type { TabItem } from './components/TabBar'
import { useFolderScan } from './hooks/useFolderScan'
import { computeDiffStats } from './utils/diffStats'
import type { FileEntry } from './types'

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'tiff', 'tif', 'webp', 'avif', 'svg',
])

const BINARY_EXTENSIONS = new Set([
  // Archivos comprimidos
  'zip', 'gz', 'tar', 'rar', '7z', 'bz2', 'xz', 'zst', 'cab', 'iso',
  // Documentos de Office y PDF
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  // Ejecutables y bibliotecas
  'exe', 'dll', 'so', 'dylib', 'bin', 'obj', 'o', 'a', 'lib', 'wasm', 'class', 'pyc', 'pyo',
  // Multimedia
  'mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv', 'flac', 'ogg', 'webm', 'aac', 'm4a', 'm4v',
  // Imágenes no soportadas por el navegador
  'heic', 'heif', 'psd', 'ai', 'raw', 'cr2', 'nef',
  // Bases de datos y otros binarios
  'db', 'sqlite', 'sqlite3', 'mdb', 'accdb', 'dat', 'pak', 'cache', 'jar', 'apk', 'ipa',
])

function isImageExtension(ext: string): boolean {
  return IMAGE_EXTENSIONS.has(ext.toLowerCase())
}

function isBinaryExtension(ext: string): boolean {
  return BINARY_EXTENSIONS.has(ext.toLowerCase())
}

interface DiffTabData {
  file: FileEntry
  leftContent: string
  rightContent: string
  loading: boolean
  unsupported: boolean
  isImage: boolean
  // stats para la barra de estado
  diffStats?: { identical: number; different: number; commentsOnly: number; leftOnly: number; rightOnly: number; total: number }
  imageDims?: { left: ImageDims | null; right: ImageDims | null }
}

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

  const [openTabs, setOpenTabs] = useState<Map<string, DiffTabData>>(new Map())
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [showComparisonTab, setShowComparisonTab] = useState(false)

  // Cuando termina el escaneo, mostrar y activar el tab de Comparación
  useEffect(() => {
    if (scanResult) {
      setShowComparisonTab(true)
      setActiveTabId(COMPARISON_TAB_ID)
    }
  }, [scanResult])

  // Keyboard shortcuts globales
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
      } else if (e.key === 'Escape' && activeTabId !== COMPARISON_TAB_ID && showComparisonTab) {
        setActiveTabId(COMPARISON_TAB_ID)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openLeft, openRight, scan, activeTabId, showComparisonTab])

  const handleFileOpen = useCallback(async (file: FileEntry) => {
    const id = file.relativePath
    if (openTabs.has(id)) {
      setActiveTabId(id)
      return
    }
    // Imágenes: visor dedicado sin necesidad de leer contenido
    if (isImageExtension(file.extension)) {
      setOpenTabs((prev) => {
        const next = new Map(prev)
        next.set(id, { file, leftContent: '', rightContent: '', loading: false, unsupported: false, isImage: true })
        return next
      })
      setActiveTabId(id)
      return
    }
    // Binarios no soportados
    if (isBinaryExtension(file.extension)) {
      setOpenTabs((prev) => {
        const next = new Map(prev)
        next.set(id, { file, leftContent: '', rightContent: '', loading: false, unsupported: true, isImage: false })
        return next
      })
      setActiveTabId(id)
      return
    }
    // Archivos de texto: cargar contenido
    setOpenTabs((prev) => {
      const next = new Map(prev)
      next.set(id, { file, leftContent: '', rightContent: '', loading: true, unsupported: false, isImage: false })
      return next
    })
    setActiveTabId(id)
    const [left, right] = await Promise.all([
      file.leftPath ? window.electronAPI.readFile(file.leftPath) : Promise.resolve(''),
      file.rightPath ? window.electronAPI.readFile(file.rightPath) : Promise.resolve('')
    ])
    const diffStats = computeDiffStats(left, right)
    setOpenTabs((prev) => {
      const next = new Map(prev)
      next.set(id, { file, leftContent: left, rightContent: right, loading: false, unsupported: false, isImage: false, diffStats })
      return next
    })
  }, [openTabs])

  const handleCloseTab = useCallback((id: string) => {
    if (id === COMPARISON_TAB_ID) {
      setShowComparisonTab(false)
      if (activeTabId === COMPARISON_TAB_ID) {
        const firstFile = Array.from(openTabs.keys())[0]
        setActiveTabId(firstFile ?? '')
      }
      return
    }
    setOpenTabs((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    if (activeTabId === id) {
      if (showComparisonTab) {
        setActiveTabId(COMPARISON_TAB_ID)
      } else {
        const remaining = Array.from(openTabs.keys()).filter((k) => k !== id)
        setActiveTabId(remaining[0] ?? '')
      }
    }
  }, [activeTabId, openTabs, showComparisonTab])

  const handleClear = useCallback(() => {
    clear()
    setOpenTabs(new Map())
    setShowComparisonTab(false)
    setActiveTabId('')
  }, [clear])

  const saveSide = useCallback(async (
    pathKey: 'leftPath' | 'rightPath',
    contentKey: 'leftContent' | 'rightContent',
    content: string
  ) => {
    const tab = openTabs.get(activeTabId)
    const filePath = tab?.file[pathKey]
    if (!filePath) return
    await window.electronAPI.writeFile(filePath, content)
    setOpenTabs((prev) => {
      const t = prev.get(activeTabId)!
      return new Map(prev).set(activeTabId, { ...t, [contentKey]: content })
    })
  }, [openTabs, activeTabId])

  const saveLeft  = useCallback((content: string) => saveSide('leftPath',  'leftContent',  content), [saveSide])
  const saveRight = useCallback((content: string) => saveSide('rightPath', 'rightContent', content), [saveSide])

  const copySide = useCallback(async (
    src: 'leftPath' | 'rightPath',
    dest: 'leftPath' | 'rightPath',
    contentKey: 'leftContent' | 'rightContent',
    destLabel: string,
    content: string
  ): Promise<boolean> => {
    const tab = openTabs.get(activeTabId)
    if (!tab?.file[src] || !tab?.file[dest]) return false
    const confirmed = window.confirm(
      `¿Sobreescribir "${tab.file.name}" en la carpeta ${destLabel}?\nSe creará una copia de seguridad .bak automáticamente.`
    )
    if (!confirmed) return false
    await window.electronAPI.copyFileWithBak(tab.file[src]!, tab.file[dest]!)
    setOpenTabs((prev) => {
      const t = prev.get(activeTabId)!
      return new Map(prev).set(activeTabId, { ...t, [contentKey]: content })
    })
    scan()
    return true
  }, [openTabs, activeTabId, scan])

  const copyToRight = useCallback((content: string) => copySide('leftPath',  'rightPath', 'rightContent', 'derecha',    content), [copySide])
  const copyToLeft  = useCallback((content: string) => copySide('rightPath', 'leftPath',  'leftContent',  'izquierda', content), [copySide])

  const handleImageDimsLoaded = useCallback((id: string, left: ImageDims | null, right: ImageDims | null) => {
    setOpenTabs((prev) => {
      const t = prev.get(id)
      if (!t) return prev
      return new Map(prev).set(id, { ...t, imageDims: { left, right } })
    })
  }, [])

  // Construir lista de tabs visible
  const tabItems: TabItem[] = [
    ...(showComparisonTab ? [{ id: COMPARISON_TAB_ID, label: 'Comparación', extension: '', loading: false }] : []),
    ...Array.from(openTabs.values()).map((t) => ({
      id: t.file.relativePath,
      label: t.file.name,
      extension: t.file.extension,
      loading: t.loading,
    }))
  ]

  const noTabs = tabItems.length === 0

  // StatusInfo según el tab activo
  const statusInfo: StatusInfo = (() => {
    if (activeTabId === COMPARISON_TAB_ID || activeTabId === '') {
      return scanResult ? { kind: 'comparison', stats: scanResult.stats } : { kind: 'empty' }
    }
    const tab = openTabs.get(activeTabId)
    if (!tab) return { kind: 'empty' }
    if (tab.isImage) {
      return {
        kind: 'image',
        leftDims: tab.imageDims?.left ?? null,
        rightDims: tab.imageDims?.right ?? null,
        leftSize: tab.file.leftSize,
        rightSize: tab.file.rightSize,
      }
    }
    if (tab.diffStats) {
      return { kind: 'diff', ...tab.diffStats }
    }
    return { kind: 'empty' }
  })()

  return (
    <TooltipProvider delayDuration={400}>
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      <TitleBar />

      <Toolbar
        leftFolder={leftFolder}
        rightFolder={rightFolder}
        onOpenLeft={openLeft}
        onOpenRight={openRight}
        onRefresh={scan}
        scanning={scanning}
      />

      <TabBar
        tabs={tabItems}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
      />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Sin tabs: pantalla de bienvenida */}
        {noTabs && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-[#858585]" role="main" aria-label="Pantalla de bienvenida">
            <MergeMateLogo size={160} />
            <div className="text-3xl font-bold tracking-wide text-[#cccccc]">MergeMate</div>
            <div className="text-sm">Abre dos carpetas para comenzar a comparar</div>
            <div className="mt-1 flex gap-4 text-sm text-[#aaaaaa]" aria-label="Atajos de teclado disponibles">
              <span>Ctrl+L — Abrir izquierda</span>
              <span>Ctrl+R — Abrir derecha</span>
              <span>Ctrl+F5 — Actualizar</span>
            </div>
          </div>
        )}

        {/* Tab: Comparación */}
        {showComparisonTab && (
          <div
            className={activeTabId === COMPARISON_TAB_ID ? 'flex flex-1 flex-col overflow-hidden' : 'hidden'}
            aria-hidden={activeTabId !== COMPARISON_TAB_ID ? true : undefined}
          >
            <AnimatePresence>
              {scanning && progress && <ProgressBar progress={progress} />}
            </AnimatePresence>
            <FileTree
              entries={scanResult?.files ?? []}
              onFileOpen={handleFileOpen}
              onHover={() => {}}
            />
          </div>
        )}

        {/* Tabs de archivos */}
        {Array.from(openTabs.entries()).map(([id, tab]) => (
          <div
            key={id}
            className={activeTabId === id ? 'flex flex-1 flex-col overflow-hidden' : 'hidden'}
            aria-hidden={activeTabId !== id ? true : undefined}
          >
            {tab.loading ? (
              <div className="flex flex-1 items-center justify-center text-[#858585]" role="status" aria-live="polite">
                Cargando archivo…
              </div>
            ) : tab.isImage ? (
              <ImageViewer
                file={tab.file}
                onDimsLoaded={(l, r) => handleImageDimsLoaded(id, l, r)}
              />
            ) : tab.unsupported ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[#858585]" role="alert">
                <div className="text-5xl" aria-hidden="true">🚫</div>
                <div className="text-lg font-semibold text-[#cccccc]">Formato no disponible</div>
                <div className="text-sm">
                  El archivo <span className="text-[#aaaaaa]">.{tab.file.extension}</span> es binario y no puede compararse como texto.
                </div>
              </div>
            ) : (
              <DiffViewer
                file={tab.file}
                leftContent={tab.leftContent}
                rightContent={tab.rightContent}
                onSaveLeft={saveLeft}
                onSaveRight={saveRight}
                onCopyToLeft={copyToLeft}
                onCopyToRight={copyToRight}
              />
            )}
          </div>
        ))}
      </div>

      <StatusBar info={statusInfo} />
    </div>
    </TooltipProvider>
  )
}
