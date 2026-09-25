import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ScanStats, FileStatus } from '../types'
import type { DiffStats } from '../utils/diffStats'
import { formatSize } from '../utils/format'

export interface ImageDims {
  width: number
  height: number
}

export type StatusInfo =
  | { kind: 'comparison'; stats: ScanStats }
  | { kind: 'diff'; identical: number; different: number; commentsOnly: number; leftOnly: number; rightOnly: number; total: number }
  | { kind: 'image'; leftDims: ImageDims | null; rightDims: ImageDims | null; leftSize: number | null; rightSize: number | null }
  | { kind: 'empty' }

interface StatusBarProps {
  info: StatusInfo
  activeStatusFilter: FileStatus | null
  onStatusFilterChange: (status: FileStatus | null) => void
}

function Dot({ color }: { color: string }): React.JSX.Element {
  return <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
}

function Stat({ dot, label, pressed, onClick, ariaLabel }: { dot?: string; label: string; pressed?: boolean; onClick?: () => void; ariaLabel?: string }): React.JSX.Element {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed ?? false}
        aria-label={ariaLabel ?? label}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 transition-colors ${pressed ? 'bg-white/20' : 'hover:bg-white/10'}`}
      >
        {dot && <Dot color={dot} />}
        {label}
      </button>
    )
  }
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      {dot && <Dot color={dot} />}
      {label}
    </span>
  )
}

function Sep(): React.JSX.Element {
  return <span className="text-white/40">|</span>
}

export function StatusBar({ info, activeStatusFilter, onStatusFilterChange }: StatusBarProps): React.JSX.Element {
  const { t } = useTranslation()

  function toggleFilter(status: FileStatus): void {
    onStatusFilterChange(activeStatusFilter === status ? null : status)
  }

  return (
    <div className="flex h-8 items-center gap-3 border-t border-[#3e3e42] bg-[#007acc] px-3 text-sm text-white overflow-hidden">

      {info.kind === 'comparison' && (
        <>
          <Stat
            dot="#4ade80"
            label={t('status.identical', { count: info.stats.identical })}
            ariaLabel={t('status.filterByIdentical', { count: info.stats.identical })}
            pressed={activeStatusFilter === 'identical'}
            onClick={() => toggleFilter('identical')}
          />
          <Stat
            dot="#f87171"
            label={t('status.different', { count: info.stats.different })}
            ariaLabel={t('status.filterByDifferent', { count: info.stats.different })}
            pressed={activeStatusFilter === 'different'}
            onClick={() => toggleFilter('different')}
          />
          <Stat
            dot="#facc15"
            label={t('status.commentsOnly', { count: info.stats.commentsOnly })}
            ariaLabel={t('status.filterByCommentsOnly', { count: info.stats.commentsOnly })}
            pressed={activeStatusFilter === 'comments-only'}
            onClick={() => toggleFilter('comments-only')}
          />
          <Stat
            dot="#60a5fa"
            label={t('status.leftOnly', { count: info.stats.leftOnly })}
            ariaLabel={t('status.filterByLeftOnly', { count: info.stats.leftOnly })}
            pressed={activeStatusFilter === 'left-only'}
            onClick={() => toggleFilter('left-only')}
          />
          <Stat
            dot="#c084fc"
            label={t('status.rightOnly', { count: info.stats.rightOnly })}
            ariaLabel={t('status.filterByRightOnly', { count: info.stats.rightOnly })}
            pressed={activeStatusFilter === 'right-only'}
            onClick={() => toggleFilter('right-only')}
          />
          <Sep />
          <Stat label={t('status.totalFiles', { count: info.stats.total })} />
        </>
      )}

      {info.kind === 'diff' && (
        <>
          <Stat dot="#4ade80" label={t('status.identicalLines',    { count: info.identical })} />
          <Stat dot="#f87171" label={t('status.differentLines',    { count: info.different })} />
          <Stat dot="#facc15" label={t('status.commentsOnlyLines', { count: info.commentsOnly })} />
          <Stat dot="#60a5fa" label={t('status.leftOnly',          { count: info.leftOnly })} />
          <Stat dot="#c084fc" label={t('status.rightOnly',         { count: info.rightOnly })} />
          <Sep />
          <Stat label={t('status.totalLines', { count: info.total })} />
        </>
      )}

      {info.kind === 'image' && (
        <>
          {info.leftDims
            ? <Stat label={t('status.leftImage',  { w: info.leftDims.width,  h: info.leftDims.height })} />
            : <Stat label={t('status.leftImageNone')} />
          }
          <Stat label={formatSize(info.leftSize)} />
          <Sep />
          {info.rightDims
            ? <Stat label={t('status.rightImage', { w: info.rightDims.width, h: info.rightDims.height })} />
            : <Stat label={t('status.rightImageNone')} />
          }
          <Stat label={formatSize(info.rightSize)} />
          {info.leftDims && info.rightDims && (
            <>
              <Sep />
              {info.leftDims.width === info.rightDims.width && info.leftDims.height === info.rightDims.height
                ? <Stat dot="#4ade80" label={t('status.sameDimensions')} />
                : <Stat dot="#facc15" label={t('status.differentDimensions')} />
              }
            </>
          )}
        </>
      )}

    </div>
  )
}

export function diffStatusInfo(stats: DiffStats): StatusInfo {
  return { kind: 'diff', ...stats }
}
