import React from 'react'
import type { ScanStats } from '../types'

interface StatusBarProps {
  stats: ScanStats | null
  hoveredPath: string
}

export function StatusBar({ stats, hoveredPath }: StatusBarProps): React.JSX.Element {
  return (
    <div className="flex h-8 items-center gap-4 border-t border-[#3e3e42] bg-[#007acc] px-3 text-sm text-white">
      {stats && (
        <>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" aria-hidden="true" />
            {stats.identical} idénticos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden="true" />
            {stats.different} diferentes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
            {stats.commentsOnly} solo comentarios
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" aria-hidden="true" />
            {stats.leftOnly} solo izquierda
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-400" aria-hidden="true" />
            {stats.rightOnly} solo derecha
          </span>
          <span className="ml-2 text-white/60">|</span>
          <span>{stats.total} archivos en total</span>
        </>
      )}
      {hoveredPath && (
        <span className="ml-auto truncate text-white/80">{hoveredPath}</span>
      )}
    </div>
  )
}
