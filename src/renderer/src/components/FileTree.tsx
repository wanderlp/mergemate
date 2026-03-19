import React, { useState, useCallback, useRef, useEffect } from 'react'
import { FileRow } from './FileRow'
import type { FileEntry } from '../types'

interface FileTreeProps {
  entries: FileEntry[]
  onFileOpen: (file: FileEntry) => void
  onHover: (path: string) => void
}

function flattenVisible(entries: FileEntry[], expandedDirs: Set<string>): FileEntry[] {
  const result: FileEntry[] = []
  for (const entry of entries) {
    result.push(entry)
    if (entry.isDirectory && expandedDirs.has(entry.relativePath) && entry.children) {
      result.push(...flattenVisible(entry.children, expandedDirs))
    }
  }
  return result
}

function getParentPath(relativePath: string): string | null {
  const parts = relativePath.replace(/\/$/, '').split('/')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('/')
}

function FlattenedTree({
  entries,
  depth,
  expandedDirs,
  onToggle,
  onFileOpen,
  onHover,
  focusedPath,
  onFocusPath,
  rowRefsMap
}: {
  entries: FileEntry[]
  depth: number
  expandedDirs: Set<string>
  onToggle: (path: string) => void
  onFileOpen: (file: FileEntry) => void
  onHover: (path: string) => void
  focusedPath: string | null
  onFocusPath: (path: string) => void
  rowRefsMap: React.MutableRefObject<Map<string, HTMLDivElement>>
}): React.JSX.Element {
  return (
    <>
      {entries.map((entry) => (
        <React.Fragment key={entry.relativePath}>
          <FileRow
            entry={entry}
            depth={depth}
            expanded={expandedDirs.has(entry.relativePath)}
            onToggle={() => onToggle(entry.relativePath)}
            onDoubleClick={() => !entry.isDirectory && onFileOpen(entry)}
            onHover={onHover}
            isFocused={focusedPath === entry.relativePath}
            onFocusPath={onFocusPath}
            refCallback={(el) => {
              if (el) rowRefsMap.current.set(entry.relativePath, el)
              else rowRefsMap.current.delete(entry.relativePath)
            }}
          />
          {entry.isDirectory && expandedDirs.has(entry.relativePath) && entry.children && (
            <FlattenedTree
              entries={entry.children}
              depth={depth + 1}
              expandedDirs={expandedDirs}
              onToggle={onToggle}
              onFileOpen={onFileOpen}
              onHover={onHover}
              focusedPath={focusedPath}
              onFocusPath={onFocusPath}
              rowRefsMap={rowRefsMap}
            />
          )}
        </React.Fragment>
      ))}
    </>
  )
}

export function FileTree({
  entries,
  onFileOpen,
  onHover
}: FileTreeProps): React.JSX.Element {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [focusedPath, setFocusedPath] = useState<string | null>(null)
  const rowRefsMap = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const keyboardNav = useRef(false)

  const handleToggle = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  // Foca el contenedor cuando llegan entries (p.ej. al terminar el escaneo)
  const hadEntries = useRef(false)
  useEffect(() => {
    if (entries.length > 0 && !hadEntries.current) {
      hadEntries.current = true
      containerRef.current?.focus({ preventScroll: true })
    }
    if (entries.length === 0) hadEntries.current = false
  }, [entries.length])

  // Foca el elemento del DOM solo cuando la navegación viene del teclado
  useEffect(() => {
    if (focusedPath && keyboardNav.current) {
      keyboardNav.current = false
      const el = rowRefsMap.current.get(focusedPath)
      if (el) {
        el.focus({ preventScroll: true })
        el.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedPath])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return
    e.preventDefault()

    const visible = flattenVisible(entries, expandedDirs)
    if (visible.length === 0) return

    const currentIndex = focusedPath ? visible.findIndex((v) => v.relativePath === focusedPath) : -1
    const current = currentIndex >= 0 ? visible[currentIndex] : null

    if (e.key === 'ArrowDown') {
      const next = visible[currentIndex + 1] ?? visible[0]
      keyboardNav.current = true
      setFocusedPath(next.relativePath)

    } else if (e.key === 'ArrowUp') {
      const prev = currentIndex > 0 ? visible[currentIndex - 1] : visible[visible.length - 1]
      keyboardNav.current = true
      setFocusedPath(prev.relativePath)

    } else if (e.key === 'ArrowRight' && current?.isDirectory) {
      if (!expandedDirs.has(current.relativePath)) {
        setExpandedDirs((prev) => new Set([...prev, current.relativePath]))
      } else if (current.children && current.children.length > 0) {
        keyboardNav.current = true
        setFocusedPath(current.children[0].relativePath)
      }

    } else if (e.key === 'ArrowLeft') {
      if (current?.isDirectory && expandedDirs.has(current.relativePath)) {
        setExpandedDirs((prev) => {
          const next = new Set(prev)
          next.delete(current.relativePath)
          return next
        })
      } else {
        const parentPath = getParentPath(current?.relativePath ?? '')
        if (parentPath) {
          keyboardNav.current = true
          setFocusedPath(parentPath)
        }
      }

    } else if (e.key === 'Enter' && current) {
      if (current.isDirectory) handleToggle(current.relativePath)
      else onFileOpen(current)
    }
  }, [focusedPath, expandedDirs, entries, handleToggle, onFileOpen])

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-[#858585]">
        <div className="text-6xl">📂↔️📂</div>
        <div className="text-2xl font-semibold text-[#cccccc]">MergeMate</div>
        <div className="text-sm">Abre dos carpetas para comenzar a comparar</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-[#3e3e42] bg-[#252526] text-xs font-semibold text-[#858585]">
        <div className="w-1 flex-shrink-0" />
        <div className="flex-1 py-2 pl-2">CARPETA IZQUIERDA</div>
        <div className="w-40 flex-shrink-0 py-2 text-center">TAMAÑO</div>
        <div className="flex-1 py-2 pr-8 text-right">CARPETA DERECHA</div>
        <div className="w-6 flex-shrink-0" />
      </div>

      {/* Rows */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto outline-none"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <FlattenedTree
          entries={entries}
          depth={0}
          expandedDirs={expandedDirs}
          onToggle={handleToggle}
          onFileOpen={onFileOpen}
          onHover={onHover}
          focusedPath={focusedPath}
          onFocusPath={setFocusedPath}
          rowRefsMap={rowRefsMap}
        />
      </div>
    </div>
  )
}
