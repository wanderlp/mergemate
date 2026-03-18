import React, { useState, useCallback } from 'react'
import { FileRow } from './FileRow'
import type { FileEntry } from '../types'

interface FileTreeProps {
  entries: FileEntry[]
  onFileOpen: (file: FileEntry) => void
  onHover: (path: string) => void
}

function FlattenedTree({
  entries,
  depth,
  expandedDirs,
  onToggle,
  onFileOpen,
  onHover
}: {
  entries: FileEntry[]
  depth: number
  expandedDirs: Set<string>
  onToggle: (path: string) => void
  onFileOpen: (file: FileEntry) => void
  onHover: (path: string) => void
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
          />
          {entry.isDirectory && expandedDirs.has(entry.relativePath) && entry.children && (
            <FlattenedTree
              entries={entry.children}
              depth={depth + 1}
              expandedDirs={expandedDirs}
              onToggle={onToggle}
              onFileOpen={onFileOpen}
              onHover={onHover}
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

  const handleToggle = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

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
        <div className="w-56 flex-shrink-0 py-2 text-center">RUTA</div>
        <div className="flex-1 py-2 pr-8 text-right">CARPETA DERECHA</div>
        <div className="w-6 flex-shrink-0" />
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        <FlattenedTree
          entries={entries}
          depth={0}
          expandedDirs={expandedDirs}
          onToggle={handleToggle}
          onFileOpen={onFileOpen}
          onHover={onHover}
        />
      </div>
    </div>
  )
}
