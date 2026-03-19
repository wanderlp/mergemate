import React, { useRef } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { FileEntry, FileStatus } from '../types'

interface FileRowProps {
  entry: FileEntry
  depth: number
  expanded: boolean
  onToggle: () => void
  onDoubleClick: () => void
  onHover: (path: string) => void
  isFocused?: boolean
  onFocusPath?: (path: string) => void
  refCallback?: (el: HTMLDivElement | null) => void
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

const DOUBLE_CLICK_MS = 300

function formatSize(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
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
  onHover,
  isFocused,
  onFocusPath,
  refCallback
}: FileRowProps): React.JSX.Element {
  const color = STATUS_COLORS[entry.status]
  const indent = depth * 16
  const label = STATUS_LABELS[entry.status]

  const leftExists = Boolean(entry.leftPath)
  const rightExists = Boolean(entry.rightPath)

  const lastMouseDown = useRef(0)

  const absentSideStyle: React.CSSProperties = {
    background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.18) 4px, rgba(0,0,0,0.18) 8px)',
    opacity: 0.45
  }

  const handleMouseDown = (): void => {
    onFocusPath?.(entry.relativePath)
    const now = Date.now()
    if (now - lastMouseDown.current <= DOUBLE_CLICK_MS) {
      // Doble click manual: actuar de inmediato sin esperar el evento dblclick
      lastMouseDown.current = 0
      if (entry.isDirectory) onToggle()
      else onDoubleClick()
    } else {
      lastMouseDown.current = now
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      if (entry.isDirectory) onToggle()
      else onDoubleClick()
    }
  }

  return (
    <div
      ref={refCallback}
      role={entry.isDirectory ? 'button' : 'row'}
      tabIndex={0}
      className="group flex cursor-pointer items-center border-b border-[#2a2d2e]/50 hover:bg-[#2a2d2e] focus:bg-[#2a2d2e] focus:outline-none transition-colors select-none"
      style={isFocused ? { backgroundColor: '#37373d' } : undefined}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHover(entry.relativePath)}
      onMouseLeave={() => onHover('')}
      onFocus={() => onFocusPath?.(entry.relativePath)}
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

      {/* Center: tamaños */}
      <div className="w-40 flex-shrink-0 px-2 py-2 text-center text-xs text-[#aaaaaa]">
        {entry.leftSize === entry.rightSize && entry.leftSize !== null
          ? formatSize(entry.leftSize)
          : <span>{formatSize(entry.leftSize)} <span className="text-[#555]">/</span> {formatSize(entry.rightSize)}</span>
        }
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

      {/* Status badge */}
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
