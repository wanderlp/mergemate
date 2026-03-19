import React from 'react'
import type { ScanStats } from '../types'
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
}


function Dot({ color }: { color: string }): React.JSX.Element {
  return <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
}

function Stat({ dot, label }: { dot?: string; label: string }): React.JSX.Element {
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

export function StatusBar({ info }: StatusBarProps): React.JSX.Element {
  return (
    <div className="flex h-8 items-center gap-3 border-t border-[#3e3e42] bg-[#007acc] px-3 text-sm text-white overflow-hidden">

      {info.kind === 'comparison' && (
        <>
          <Stat dot="#4ade80" label={`${info.stats.identical} idénticos`} />
          <Stat dot="#f87171" label={`${info.stats.different} diferentes`} />
          <Stat dot="#facc15" label={`${info.stats.commentsOnly} solo comentarios`} />
          <Stat dot="#60a5fa" label={`${info.stats.leftOnly} solo izquierda`} />
          <Stat dot="#c084fc" label={`${info.stats.rightOnly} solo derecha`} />
          <Sep />
          <Stat label={`${info.stats.total} archivos`} />
        </>
      )}

      {info.kind === 'diff' && (
        <>
          <Stat dot="#4ade80" label={`${info.identical} idénticas`} />
          <Stat dot="#f87171" label={`${info.different} diferentes`} />
          <Stat dot="#facc15" label={`${info.commentsOnly} comentarios`} />
          <Stat dot="#60a5fa" label={`${info.leftOnly} solo izquierda`} />
          <Stat dot="#c084fc" label={`${info.rightOnly} solo derecha`} />
          <Sep />
          <Stat label={`${info.total} líneas`} />
        </>
      )}

      {info.kind === 'image' && (
        <>
          {info.leftDims
            ? <Stat label={`Izq: ${info.leftDims.width} × ${info.leftDims.height} px`} />
            : <Stat label="Izq: —" />
          }
          <Stat label={formatSize(info.leftSize)} />
          <Sep />
          {info.rightDims
            ? <Stat label={`Der: ${info.rightDims.width} × ${info.rightDims.height} px`} />
            : <Stat label="Der: —" />
          }
          <Stat label={formatSize(info.rightSize)} />
          {info.leftDims && info.rightDims && (
            <>
              <Sep />
              {info.leftDims.width === info.rightDims.width && info.leftDims.height === info.rightDims.height
                ? <Stat dot="#4ade80" label="Mismas dimensiones" />
                : <Stat dot="#facc15" label="Dimensiones distintas" />
              }
            </>
          )}
        </>
      )}

    </div>
  )
}

// Helper para construir StatusInfo desde DiffStats
export function diffStatusInfo(stats: DiffStats): StatusInfo {
  return { kind: 'diff', ...stats }
}
