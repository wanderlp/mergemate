import React from 'react'
import type { ScanProgress } from '../types'

interface ProgressBarProps {
  progress: ScanProgress
}

export function ProgressBar({ progress }: ProgressBarProps): React.JSX.Element {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70" role="status" aria-live="polite">
      <div className="w-96 rounded-lg bg-[#252526] p-6 shadow-2xl">
        <div className="mb-3 text-base font-medium text-[#cccccc]">Escaneando carpetas…</div>
        <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-[#3e3e42]" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="truncate text-sm text-[#aaaaaa]">{progress.currentFile || 'Iniciando…'}</div>
        <div className="mt-1 text-right text-sm text-[#aaaaaa]">{progress.percent}%</div>
      </div>
    </div>
  )
}
