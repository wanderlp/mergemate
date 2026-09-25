import React, { useRef } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FileTypeIcon } from './FileTypeIcon'
import type { FileEntry, FileStatus } from '../types'
import { formatSize } from '../utils/format'

interface FileRowProps {
  entry: FileEntry
  depth: number
  expanded: boolean
  onToggle: () => void
  onDoubleClick: () => void
  onHover: (path: string) => void
  isFocused?: boolean
  isOpen?: boolean
  onFocusPath?: (path: string) => void
  refCallback?: (el: HTMLDivElement | null) => void
  highlight?: string
}

const STATUS_COLORS: Record<FileStatus, string> = {
  identical: '#22c55e',
  different: '#ef4444',
  'comments-only': '#eab308',
  'left-only': '#3b82f6',
  'right-only': '#a855f7'
}

const STATUS_KEYS: Record<FileStatus, string> = {
  identical: 'fileRow.status.identical',
  different: 'fileRow.status.different',
  'comments-only': 'fileRow.status.commentsOnly',
  'left-only': 'fileRow.status.leftOnly',
  'right-only': 'fileRow.status.rightOnly'
}

const DOUBLE_CLICK_MS = 300


export function FileRow({
  entry,
  depth,
  expanded,
  onToggle,
  onDoubleClick,
  onHover,
  isFocused,
  isOpen,
  onFocusPath,
  refCallback,
  highlight
}: FileRowProps): React.JSX.Element {
  const { t } = useTranslation()
  const color = STATUS_COLORS[entry.status]
  const indent = depth * 16
  const label = t(STATUS_KEYS[entry.status])

  const leftExists = Boolean(entry.leftPath)
  const rightExists = Boolean(entry.rightPath)

  const lastMouseDown = useRef(0)

  function renderHighlightedName(name: string): React.ReactNode {
    if (!highlight) return name
    const lower = name.toLowerCase()
    const query = highlight.toLowerCase()
    const idx = lower.indexOf(query)
    if (idx < 0) return name
    return (
      <>
        {name.slice(0, idx)}
        <mark className="bg-[#007acc] text-white">{name.slice(idx, idx + highlight.length)}</mark>
        {name.slice(idx + highlight.length)}
      </>
    )
  }

  const absentSideStyle: React.CSSProperties = {
    background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.18) 4px, rgba(0,0,0,0.18) 8px)',
    opacity: 0.45
  }

  const handleMouseDown = (): void => {
    onFocusPath?.(entry.relativePath)
    const now = Date.now()
    if (now - lastMouseDown.current <= DOUBLE_CLICK_MS) {
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

  const fileNameStyle: React.CSSProperties = isOpen
    ? { color: '#ffffff', fontWeight: 600 }
    : { color }

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
              {expanded
                ? <FolderOpen size={16} className="flex-shrink-0 text-[#e8c27a]" />
                : <Folder size={16} className="flex-shrink-0 text-[#e8c27a]" />}
              <span className="truncate text-[#cccccc]">{renderHighlightedName(entry.name)}</span>
            </>
          ) : (
            <>
              <FileTypeIcon extension={entry.extension} name={entry.name} />
              <span className="truncate" style={fileNameStyle}>{renderHighlightedName(entry.name)}</span>
            </>
          )
        ) : (
          <span className="truncate text-[#6e6e6e]">—</span>
        )}
      </div>

      {/* Center: tamaños */}
      <div className="w-40 flex-shrink-0 px-2 py-2 text-center text-xs text-[#aaaaaa]">
        {entry.leftSize === entry.rightSize && entry.leftSize !== null
          ? formatSize(entry.leftSize)
          : <span>{formatSize(entry.leftSize)} <span className="text-[#6e6e6e]">/</span> {formatSize(entry.rightSize)}</span>
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
              <span className="truncate text-[#cccccc]">{renderHighlightedName(entry.name)}</span>
              {expanded
                ? <FolderOpen size={16} className="flex-shrink-0 text-[#e8c27a]" />
                : <Folder size={16} className="flex-shrink-0 text-[#e8c27a]" />}
            </>
          ) : (
            <>
              <span className="truncate" style={fileNameStyle}>{renderHighlightedName(entry.name)}</span>
              <FileTypeIcon extension={entry.extension} name={entry.name} />
            </>
          )
        ) : (
          <span className="truncate text-[#6e6e6e]">—</span>
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
