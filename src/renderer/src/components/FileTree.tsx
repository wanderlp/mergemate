import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FileRow } from './FileRow'
import type { FileEntry } from '../types'

interface FileTreeProps {
  entries: FileEntry[]
  onFileOpen: (file: FileEntry) => void
  onHover: (path: string) => void
}

interface FlatEntry {
  entry: FileEntry
  depth: number
}

function flattenVisible(entries: FileEntry[], expandedDirs: Set<string>, depth = 0): FlatEntry[] {
  const result: FlatEntry[] = []
  for (const entry of entries) {
    result.push({ entry, depth })
    if (entry.isDirectory && expandedDirs.has(entry.relativePath) && entry.children) {
      result.push(...flattenVisible(entry.children, expandedDirs, depth + 1))
    }
  }
  return result
}

function getParentPath(relativePath: string): string | null {
  const parts = relativePath.replace(/\/$/, '').split('/')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('/')
}

function makeRowVariants(reduced: boolean) {
  return {
    hidden: { opacity: 0, x: reduced ? 0 : -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { duration: reduced ? 0 : 0.15, delay: reduced ? 0 : Math.min(i * 0.018, 0.6) },
    }),
    exit: { opacity: 0, x: reduced ? 0 : -10, transition: { duration: reduced ? 0 : 0.1 } },
  }
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

  // Clave que cambia con cada nuevo escaneo para re-disparar las animaciones
  const scanKey = useRef(0)
  const prevEntries = useRef(entries)
  if (prevEntries.current !== entries) {
    if (entries.length > 0) scanKey.current++
    prevEntries.current = entries
    setExpandedDirs(new Set())
  }

  const handleToggle = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const hadEntries = useRef(false)
  useEffect(() => {
    if (entries.length > 0 && !hadEntries.current) {
      hadEntries.current = true
      containerRef.current?.focus({ preventScroll: true })
    }
    if (entries.length === 0) hadEntries.current = false
  }, [entries.length])

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

  const shouldReduceMotion = useReducedMotion()
  const rowVariants = makeRowVariants(shouldReduceMotion ?? false)

  const visible = flattenVisible(entries, expandedDirs)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return
    e.preventDefault()

    if (visible.length === 0) return
    const currentIndex = focusedPath ? visible.findIndex((v) => v.entry.relativePath === focusedPath) : -1
    const current = currentIndex >= 0 ? visible[currentIndex] : null

    if (e.key === 'ArrowDown') {
      const next = visible[currentIndex + 1] ?? visible[0]
      keyboardNav.current = true
      setFocusedPath(next.entry.relativePath)

    } else if (e.key === 'ArrowUp') {
      const prev = currentIndex > 0 ? visible[currentIndex - 1] : visible[visible.length - 1]
      keyboardNav.current = true
      setFocusedPath(prev.entry.relativePath)

    } else if (e.key === 'ArrowRight' && current?.entry.isDirectory) {
      if (!expandedDirs.has(current.entry.relativePath)) {
        setExpandedDirs((prev) => new Set([...prev, current.entry.relativePath]))
      } else if (current.entry.children && current.entry.children.length > 0) {
        keyboardNav.current = true
        setFocusedPath(current.entry.children[0].relativePath)
      }

    } else if (e.key === 'ArrowLeft') {
      if (current?.entry.isDirectory && expandedDirs.has(current.entry.relativePath)) {
        setExpandedDirs((prev) => {
          const next = new Set(prev)
          next.delete(current.entry.relativePath)
          return next
        })
      } else {
        const parentPath = getParentPath(current?.entry.relativePath ?? '')
        if (parentPath) {
          keyboardNav.current = true
          setFocusedPath(parentPath)
        }
      }

    } else if (e.key === 'Enter' && current) {
      if (current.entry.isDirectory) handleToggle(current.entry.relativePath)
      else onFileOpen(current.entry)
    }
  }, [focusedPath, expandedDirs, visible, handleToggle, onFileOpen])

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[#858585]">
        <div className="text-sm">No se encontraron archivos en las carpetas seleccionadas</div>
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
        <AnimatePresence mode="popLayout" initial={true}>
          {visible.map(({ entry, depth }, index) => (
            <motion.div
              key={`${scanKey.current}-${entry.relativePath}`}
              custom={index}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout={false}
            >
              <FileRow
                entry={entry}
                depth={depth}
                expanded={expandedDirs.has(entry.relativePath)}
                onToggle={() => handleToggle(entry.relativePath)}
                onDoubleClick={() => !entry.isDirectory && onFileOpen(entry)}
                onHover={onHover}
                isFocused={focusedPath === entry.relativePath}
                onFocusPath={setFocusedPath}
                refCallback={(el) => {
                  if (el) rowRefsMap.current.set(entry.relativePath, el)
                  else rowRefsMap.current.delete(entry.relativePath)
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
