import React from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { FileEntry, FileStatus } from '../types'

interface FileRowProps {
  entry: FileEntry
  depth: number
  expanded: boolean
  onToggle: () => void
  onDoubleClick: () => void
  onHover: (path: string) => void
}

const STATUS_COLORS: Record<FileStatus, string> = {
  identical: '#22c55e',
  different: '#ef4444',
  'comments-only': '#eab308',
  'left-only': '#3b82f6',
  'right-only': '#a855f7'
}

const STATUS_LABELS: Record<FileStatus, string> = {
  identical: 'Idéntico',
  different: 'Diferente',
  'comments-only': 'Solo comentarios',
  'left-only': 'Solo en izquierda',
  'right-only': 'Solo en derecha'
}

const EXT_ICONS: Record<string, string> = {
  ts: '🟦', tsx: '🟦', js: '🟨', jsx: '🟨', mjs: '🟨',
  py: '🐍', java: '☕', kt: '🟣', kts: '🟣',
  cs: '🔷', c: '🔵', h: '🔵', cpp: '🔶', cc: '🔶', hpp: '🔶',
  json: '📋', md: '📝', html: '🌐', css: '🎨', scss: '🎨',
  xml: '📄', yaml: '📄', yml: '📄', toml: '📄', ini: '📄',
  sh: '💻', bat: '💻', ps1: '💻',
  png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼', svg: '🖼',
  pdf: '📕', zip: '📦', gz: '📦',
}

function getIcon(entry: FileEntry): string {
  if (entry.isDirectory) return ''
  return EXT_ICONS[entry.extension] ?? '📄'
}

export function FileRow({
  entry,
  depth,
  expanded,
  onToggle,
  onDoubleClick,
  onHover
}: FileRowProps): React.JSX.Element {
  const color = STATUS_COLORS[entry.status]
  const indent = depth * 16
  const label = STATUS_LABELS[entry.status]

  const leftExists = Boolean(entry.leftPath)
  const rightExists = Boolean(entry.rightPath)

  // Side that is absent gets a dimmed hatched background
  const absentSideStyle: React.CSSProperties = {
    background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.18) 4px, rgba(0,0,0,0.18) 8px)',
    opacity: 0.45
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (entry.isDirectory) onToggle()
      else onDoubleClick()
    }
  }

  return (
    <div
      role={entry.isDirectory ? 'button' : 'row'}
      tabIndex={0}
      className="group flex cursor-pointer items-center border-b border-[#2a2d2e]/50 hover:bg-[#2a2d2e] focus:bg-[#2a2d2e] focus:outline-none transition-colors"
      onDoubleClick={!entry.isDirectory ? onDoubleClick : undefined}
      onClick={entry.isDirectory ? onToggle : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHover(entry.relativePath)}
      onMouseLeave={() => onHover('')}
      aria-label={`${entry.name} — ${label}`}
      aria-expanded={entry.isDirectory ? expanded : undefined}
      title={label}
    >
      {/* Color indicator */}
      <div className="w-1.5 self-stretch flex-shrink-0" style={{ backgroundColor: color }} />

      {/* Left column */}
      <div
        className="relative flex flex-1 items-center gap-1.5 py-2 pr-2 text-sm"
        style={{
          paddingLeft: `${indent + 10}px`,
          ...(!leftExists ? absentSideStyle : {})
        }}
      >
        {leftExists ? (
          entry.isDirectory ? (
            <>
              {expanded
                ? <ChevronDown size={16} className="flex-shrink-0 text-[#aaaaaa]" />
                : <ChevronRight size={16} className="flex-shrink-0 text-[#aaaaaa]" />}
              <span className="text-[#e8c27a]">📁</span>
              <span className="truncate text-[#cccccc]">{entry.name}</span>
            </>
          ) : (
            <>
              <span className="flex-shrink-0">{getIcon(entry)}</span>
              <span className="truncate" style={{ color }}>{entry.name}</span>
            </>
          )
        ) : (
          <span className="truncate text-[#555]">—</span>
        )}
      </div>

      {/* Center: relative path */}
      <div className="w-56 flex-shrink-0 truncate px-2 py-2 text-center text-xs text-[#aaaaaa]">
        {entry.relativePath.replace(/\/$/, '')}
      </div>

      {/* Right column */}
      <div
        className="flex flex-1 items-center justify-end gap-1.5 py-2 pl-2 text-sm"
        style={{
          paddingRight: `${indent + 10}px`,
          ...(!rightExists ? absentSideStyle : {})
        }}
      >
        {rightExists ? (
          entry.isDirectory ? (
            <>
              <span className="truncate text-[#cccccc]">{entry.name}</span>
              <span className="text-[#e8c27a]">📁</span>
            </>
          ) : (
            <>
              <span className="truncate" style={{ color }}>{entry.name}</span>
              <span className="flex-shrink-0">{getIcon(entry)}</span>
            </>
          )
        ) : (
          <span className="truncate text-[#555]">—</span>
        )}
      </div>

      {/* Status badge — solo cuando el archivo existe en ambos lados */}
      <div className="w-6 flex-shrink-0 text-center">
        {leftExists && rightExists && (
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}
