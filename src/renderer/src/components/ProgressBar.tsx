import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ScanProgress } from '../types'

interface ProgressBarProps {
  progress: ScanProgress
}

export function ProgressBar({ progress }: ProgressBarProps): React.JSX.Element {
  const shouldReduceMotion = useReducedMotion()
  const duration = shouldReduceMotion ? 0 : 0.2

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70"
      role="status"
      aria-live="polite"
      aria-label="Escaneando carpetas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    >
      <motion.div
        className="w-96 rounded-lg bg-[#252526] p-6 shadow-2xl"
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : -8 }}
        transition={{ duration, ease: 'easeOut' }}
      >
        <div className="mb-3 text-base font-medium text-[#cccccc]">Escaneando carpetas…</div>
        <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-[#3e3e42]" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ backgroundColor: '#007acc', width: `${progress.percent}%` }}
          />
        </div>
        <div className="truncate text-sm text-[#aaaaaa]">{progress.currentFile || 'Iniciando…'}</div>
        <div className="mt-1 text-right text-sm text-[#aaaaaa]">{progress.percent}%</div>
      </motion.div>
    </motion.div>
  )
}
