import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import type { FileEntry } from '../types'
import type { ImageDims } from './StatusBar'

interface ImageViewerProps {
  file: FileEntry
  onDimsLoaded?: (left: ImageDims | null, right: ImageDims | null) => void
}

// Mime type por extensión para la data URL
const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  tiff: 'image/tiff', tif: 'image/tiff',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
}

function toDataUrl(base64: string, ext: string): string {
  const mime = MIME[ext.toLowerCase()] ?? 'image/jpeg'
  return `data:${mime};base64,${base64}`
}

type ViewMode = 'slider' | 'sidebyside' | 'left' | 'right'

const MODE_LABELS: Record<ViewMode, string> = {
  sidebyside: 'Lado a lado',
  slider:     'Slider',
  left:       'Solo izquierda',
  right:      'Solo derecha',
}

function getImageDims(url: string): Promise<ImageDims> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = url
  })
}

export function ImageViewer({ file, onDimsLoaded }: ImageViewerProps): React.JSX.Element {
  const [mode, setMode] = useState<ViewMode>('sidebyside')
  const [zoom, setZoom] = useState(1)
  const [leftUrl,  setLeftUrl]  = useState<string | null>(null)
  const [rightUrl, setRightUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setLeftUrl(null)
    setRightUrl(null)

    let leftDataUrl: string | null = null
    let rightDataUrl: string | null = null

    const promises: Promise<void>[] = []

    if (file.leftPath) {
      promises.push(
        window.electronAPI.readFileBase64(file.leftPath)
          .then((b64) => { leftDataUrl = toDataUrl(b64, file.extension); setLeftUrl(leftDataUrl) })
          .catch(() => setLeftUrl(null))
      )
    }
    if (file.rightPath) {
      promises.push(
        window.electronAPI.readFileBase64(file.rightPath)
          .then((b64) => { rightDataUrl = toDataUrl(b64, file.extension); setRightUrl(rightDataUrl) })
          .catch(() => setRightUrl(null))
      )
    }

    Promise.all(promises).then(async () => {
      if (!onDimsLoaded) return
      const [leftDims, rightDims] = await Promise.all([
        leftDataUrl  ? getImageDims(leftDataUrl).catch(() => null)  : Promise.resolve(null),
        rightDataUrl ? getImageDims(rightDataUrl).catch(() => null) : Promise.resolve(null),
      ])
      onDimsLoaded(leftDims, rightDims)
    }).finally(() => setLoading(false))
  }, [file.leftPath, file.rightPath, file.extension])

  const bothExist   = Boolean(leftUrl && rightUrl)
  const onlyLeft    = Boolean(leftUrl && !rightUrl)
  const isIdentical = file.status === 'identical'

  const effectiveMode: ViewMode =
    !bothExist || isIdentical ? (onlyLeft || isIdentical ? 'left' : 'right') : mode

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Resetear pan al cambiar zoom a 1 o cambiar imagen
  useEffect(() => { if (zoom === 1) setPan({ x: 0, y: 0 }) }, [zoom])
  useEffect(() => { setPan({ x: 0, y: 0 }) }, [file.leftPath, file.rightPath])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = pan
    setIsDragging(true)
    e.preventDefault()
  }, [zoom, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    dragging.current = false
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.15 : -0.15
    setZoom((z) => Math.min(4, Math.max(0.25, parseFloat((z + delta).toFixed(2)))))
  }, [])

  function handleZoomIn():  void { setZoom((z) => Math.min(z + 0.25, 4)) }
  function handleZoomOut(): void { setZoom((z) => Math.max(z - 0.25, 0.25)) }
  function handleReset():   void { setZoom(1); setPan({ x: 0, y: 0 }) }

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[#3e3e42] bg-[#252526] px-3 py-2">
        <span className="truncate text-sm text-[#cccccc]">{file.relativePath}</span>

        <div className="ml-auto flex items-center gap-1">
          {bothExist && !isIdentical && (Object.keys(MODE_LABELS) as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1.5 text-xs transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#3e3e42] text-[#cccccc] hover:bg-[#505050]'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
          {isIdentical && (
            <span className="rounded bg-green-900/40 px-2 py-1 text-xs text-green-400">
              Imágenes idénticas
            </span>
          )}

          <div className="mx-2 h-4 w-px bg-[#3e3e42]" />

          <button onClick={handleZoomOut} disabled={zoom <= 0.25}
            className="rounded bg-[#3e3e42] p-1.5 text-[#cccccc] hover:bg-[#505050] disabled:opacity-40 transition-colors"
            title="Alejar">
            <ZoomOut size={14} />
          </button>
          <span className="w-12 text-center text-xs text-[#aaaaaa]">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} disabled={zoom >= 4}
            className="rounded bg-[#3e3e42] p-1.5 text-[#cccccc] hover:bg-[#505050] disabled:opacity-40 transition-colors"
            title="Acercar">
            <ZoomIn size={14} />
          </button>
          <button onClick={handleReset}
            className="rounded bg-[#3e3e42] p-1.5 text-[#cccccc] hover:bg-[#505050] transition-colors"
            title="Restablecer zoom">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#181818]"
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {loading ? (
          <span className="text-sm text-[#858585]">Cargando imagen…</span>
        ) : (
          <div style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease',
            userSelect: 'none',
          }}>
            {effectiveMode === 'slider' && leftUrl && rightUrl && (
              <ReactCompareSlider
                style={{ width: 800, maxWidth: '90vw', borderRadius: 4, overflow: 'hidden' }}
                itemOne={<ReactCompareSliderImage src={leftUrl} alt="Izquierda" style={{ objectFit: 'contain' }} />}
                itemTwo={<ReactCompareSliderImage src={rightUrl} alt="Derecha"   style={{ objectFit: 'contain' }} />}
              />
            )}

            {effectiveMode === 'sidebyside' && leftUrl && rightUrl && (
              <div className="flex gap-6">
                <ImagePanel url={leftUrl} label="Izquierda" />
                <ImagePanel url={rightUrl} label="Derecha" />
              </div>
            )}

            {effectiveMode === 'left'  && leftUrl  && <ImagePanel url={leftUrl}  label={isIdentical ? '' : 'Izquierda'} />}
            {effectiveMode === 'right' && rightUrl  && <ImagePanel url={rightUrl} label={isIdentical ? '' : 'Derecha'} />}
          </div>
        )}
      </div>
    </div>
  )
}

function ImagePanel({ url, label }: { url: string; label: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-xs font-semibold uppercase tracking-wider text-[#858585]">{label}</span>}
      <img
        src={url}
        alt={label}
        style={{ maxWidth: 560, maxHeight: '65vh', objectFit: 'contain', borderRadius: 4 }}
        className="border border-[#3e3e42]"
      />
    </div>
  )
}
