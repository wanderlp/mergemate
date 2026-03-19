import React, { useState, useCallback, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { FileTree } from './components/FileTree'
import { DiffViewer } from './components/DiffViewer'
import { ImageViewer } from './components/ImageViewer'
import { ProgressBar } from './components/ProgressBar'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import type { TabItem } from './components/TabBar'
import { useFolderScan } from './hooks/useFolderScan'
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
      setActiveTabId('comparison')
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
      } else if (e.key === 'Escape' && activeTabId !== 'comparison' && showComparisonTab) {
        setActiveTabId('comparison')
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
    setOpenTabs((prev) => {
      const next = new Map(prev)
      next.set(id, { file, leftContent: left, rightContent: right, loading: false, unsupported: false, isImage: false })
      return next
    })
  }, [openTabs])

  const handleCloseTab = useCallback((id: string) => {
    if (id === 'comparison') {
      setShowComparisonTab(false)
      if (activeTabId === 'comparison') {
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
        setActiveTabId('comparison')
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

  const saveLeft = useCallback(async (content: string) => {
    const tab = openTabs.get(activeTabId)
    if (!tab?.file.leftPath) return
    await window.electronAPI.writeFile(tab.file.leftPath, content)
    setOpenTabs((prev) => {
      const t = prev.get(activeTabId)!
      return new Map(prev).set(activeTabId, { ...t, leftContent: content })
    })
  }, [openTabs, activeTabId])

  const saveRight = useCallback(async (content: string) => {
    const tab = openTabs.get(activeTabId)
    if (!tab?.file.rightPath) return
    await window.electronAPI.writeFile(tab.file.rightPath, content)
    setOpenTabs((prev) => {
      const t = prev.get(activeTabId)!
      return new Map(prev).set(activeTabId, { ...t, rightContent: content })
    })
  }, [openTabs, activeTabId])

  const copyToRight = useCallback(async (content: string): Promise<boolean> => {
    const tab = openTabs.get(activeTabId)
    if (!tab?.file.leftPath || !tab?.file.rightPath) return false
    const confirmed = window.confirm(
      `¿Sobreescribir "${tab.file.name}" en la carpeta derecha?\nSe creará una copia de seguridad .bak automáticamente.`
    )
    if (!confirmed) return false
    await window.electronAPI.copyFileWithBak(tab.file.leftPath, tab.file.rightPath)
    setOpenTabs((prev) => {
      const t = prev.get(activeTabId)!
      return new Map(prev).set(activeTabId, { ...t, rightContent: content })
    })
    scan()
    return true
  }, [openTabs, activeTabId, scan])

  const copyToLeft = useCallback(async (content: string): Promise<boolean> => {
    const tab = openTabs.get(activeTabId)
    if (!tab?.file.leftPath || !tab?.file.rightPath) return false
    const confirmed = window.confirm(
      `¿Sobreescribir "${tab.file.name}" en la carpeta izquierda?\nSe creará una copia de seguridad .bak automáticamente.`
    )
    if (!confirmed) return false
    await window.electronAPI.copyFileWithBak(tab.file.rightPath, tab.file.leftPath)
    setOpenTabs((prev) => {
      const t = prev.get(activeTabId)!
      return new Map(prev).set(activeTabId, { ...t, leftContent: content })
    })
    scan()
    return true
  }, [openTabs, activeTabId, scan])

  // Construir lista de tabs visible
  const tabItems: TabItem[] = [
    ...(showComparisonTab ? [{ id: 'comparison', label: 'Comparación', extension: '', loading: false }] : []),
    ...Array.from(openTabs.values()).map((t) => ({
      id: t.file.relativePath,
      label: t.file.name,
      extension: t.file.extension,
      loading: t.loading,
    }))
  ]

  const noTabs = tabItems.length === 0

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      <Toolbar
        leftFolder={leftFolder}
        rightFolder={rightFolder}
        onOpenLeft={openLeft}
        onOpenRight={openRight}
        onRefresh={scan}
        onClear={handleClear}
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
        )}

        {/* Tab: Comparación */}
        {showComparisonTab && (
          <div className={activeTabId === 'comparison' ? 'flex flex-1 flex-col overflow-hidden' : 'hidden'}>
            {scanning && progress && <ProgressBar progress={progress} />}
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
          >
            {tab.loading ? (
              <div className="flex flex-1 items-center justify-center text-[#858585]">
                Cargando archivo…
              </div>
            ) : tab.isImage ? (
              <ImageViewer file={tab.file} />
            ) : tab.unsupported ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[#858585]">
                <div className="text-5xl">🚫</div>
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

      <StatusBar stats={scanResult?.stats ?? null} />
    </div>
  )
}
