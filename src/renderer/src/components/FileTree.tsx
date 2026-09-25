import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FileRow } from './FileRow'
import type { FileEntry, FileStatus } from '../types'

const ALL_STATUSES: FileStatus[] = ['identical', 'different', 'comments-only', 'left-only', 'right-only']

const STATUS_KEY: Record<FileStatus, string> = {
  identical: 'identical',
  different: 'different',
  'comments-only': 'commentsOnly',
  'left-only': 'leftOnly',
  'right-only': 'rightOnly'
}

interface FlatEntry {
  entry: FileEntry
  depth: number
}

function matchesFilters(entry: FileEntry, query: string, statusFilters: Set<FileStatus>): boolean {
  if (entry.isDirectory) return true
  if (statusFilters.size > 0 && !statusFilters.has(entry.status)) return false
  if (query && !entry.relativePath.toLowerCase().includes(query)) return false
  return true
}

interface FileTreeProps {
  entries: FileEntry[]
  openTabIds: Set<string>
  scanVersion: number
  onFileOpen: (file: FileEntry) => void
  onHover: (path: string) => void
  statusFilter?: import('../types').FileStatus | null
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

function collectMatchingDirs(entries: FileEntry[], query: string, statusFilters: Set<FileStatus>): Set<string> {
  const result = new Set<string>()
  function walk(list: FileEntry[]): boolean {
    let anyMatch = false
    for (const e of list) {
      if (e.isDirectory && e.children) {
        const childMatch = walk(e.children)
        if (childMatch) {
          result.add(e.relativePath)
          anyMatch = true
        }
      } else if (matchesFilters(e, query, statusFilters)) {
        anyMatch = true
      }
    }
    return anyMatch
  }
  walk(entries)
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
  openTabIds,
  scanVersion,
  onFileOpen,
  onHover,
  statusFilter = null
}: FileTreeProps): React.JSX.Element {
  const { t } = useTranslation()
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [focusedPath, setFocusedPath] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<Set<FileStatus>>(new Set())
  const rowRefsMap = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const keyboardNav = useRef(false)

  const isFiltering = searchQuery.length > 0 || statusFilters.size > 0 || Boolean(statusFilter)

  const effectiveStatusFilters = useMemo<Set<FileStatus>>(() => {
    if (statusFilter && !statusFilters.size) return new Set([statusFilter])
    if (statusFilter) return new Set([...statusFilters, statusFilter])
    return statusFilters
  }, [statusFilter, statusFilters])

  useEffect(() => {
    const handle = setTimeout(() => setSearchQuery(searchInput.toLowerCase()), 200)
    return () => clearTimeout(handle)
  }, [searchInput])

  const matchingDirs = useMemo(
    () => isFiltering ? collectMatchingDirs(entries, searchQuery, effectiveStatusFilters) : new Set<string>(),
    [entries, searchQuery, effectiveStatusFilters, isFiltering]
  )

  const effectiveExpanded = useMemo(() => {
    if (!isFiltering) return expandedDirs
    return new Set([...expandedDirs, ...matchingDirs])
  }, [expandedDirs, matchingDirs, isFiltering])

  const filteredEntries = useMemo(() => {
    if (!isFiltering) return entries
    return entries.filter((e) => {
      if (e.isDirectory) return matchingDirs.has(e.relativePath)
      return matchesFilters(e, searchQuery, effectiveStatusFilters)
    })
  }, [entries, searchQuery, effectiveStatusFilters, isFiltering, matchingDirs])

  const matchCount = useMemo(() => {
    let n = 0
    function walk(list: FileEntry[]): void {
      for (const e of list) {
        if (e.isDirectory && e.children) walk(e.children)
        else if (matchesFilters(e, searchQuery, effectiveStatusFilters)) n++
      }
    }
    walk(entries)
    return n
  }, [entries, searchQuery, effectiveStatusFilters])

  function toggleStatusFilter(status: FileStatus): void {
    setStatusFilters((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  function clearFilters(): void {
    setSearchInput('')
    setStatusFilters(new Set())
  }

  // scanKey cambia solo en re-escaneos completos (no en actualizaciones puntuales de fila)
  const scanKey = useRef(0)
  const prevScanVersion = useRef(scanVersion)
  if (prevScanVersion.current !== scanVersion) {
    scanKey.current++
    prevScanVersion.current = scanVersion
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

  const visible = flattenVisible(filteredEntries, effectiveExpanded)

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
        <div className="text-sm">{t('fileTree.emptyState')}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Filtros */}
      <div className="flex flex-col gap-2 border-b border-[#3e3e42] bg-[#252526] px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#858585]" aria-hidden="true" />
            <input
              type="text"
              role="searchbox"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('fileTree.searchPlaceholder')}
              aria-label={t('fileTree.searchPlaceholder')}
              className="w-full rounded bg-[#1e1e1e] py-1 pl-7 pr-2 text-xs text-[#cccccc] placeholder-[#555] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
            />
          </div>
          {isFiltering && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#aaaaaa] transition-colors hover:bg-[#3e3e42] hover:text-[#cccccc]"
              title={t('fileTree.clearFilters')}
              aria-label={t('fileTree.clearFilters')}
            >
              <X size={12} aria-hidden="true" />
              {t('fileTree.clear')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {ALL_STATUSES.map((status) => (
            <label key={status} className="flex cursor-pointer items-center gap-1.5 text-xs text-[#aaaaaa]">
              <input
                type="checkbox"
                checked={statusFilters.has(status)}
                onChange={() => toggleStatusFilter(status)}
                className="h-3 w-3 cursor-pointer accent-[#007acc]"
                aria-label={t(`fileRow.status.${STATUS_KEY[status]}`)}
              />
              <span>{t(`fileRow.status.${STATUS_KEY[status]}`)}</span>
            </label>
          ))}
        </div>
        <div role="status" aria-live="polite" className="sr-only">
          {isFiltering ? t('fileTree.matchCount', { shown: matchCount }) : ''}
        </div>
      </div>

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
        {visible.length === 0 && isFiltering ? (
          <div className="flex flex-1 items-center justify-center py-8 text-sm text-[#858585]">
            {t('fileTree.noMatches')}
          </div>
        ) : (
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
                  isOpen={openTabIds.has(entry.relativePath)}
                  onFocusPath={setFocusedPath}
                  refCallback={(el) => {
                    if (el) rowRefsMap.current.set(entry.relativePath, el)
                    else rowRefsMap.current.delete(entry.relativePath)
                  }}
                  highlight={isFiltering ? searchQuery : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
