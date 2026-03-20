import React, { useState, useEffect } from 'react'
import { FolderOpen, FileText, GitBranch, Clock, ArrowRight } from 'lucide-react'
import { TitleBar, AppIcon } from './TitleBar'
import type { RecentComparison } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function basename(p: string): string {
  return p.replace(/[/\\]+$/, '').split(/[/\\]/).pop() ?? p
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7)   return `hace ${days} días`
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ── Componente principal ──────────────────────────────────────────────────────

export function StartupScreen(): React.JSX.Element {
  const [recents, setRecents] = useState<RecentComparison[]>([])

  useEffect(() => {
    window.electronAPI.getRecentComparisons().then(setRecents)
  }, [])

  function handleOpenMain(): void {
    window.electronAPI.openMainWindow()
  }

  function handleOpenRecent(r: RecentComparison): void {
    window.electronAPI.openMainWindow(r.left, r.right)
  }

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]" role="main">
      <TitleBar showMaximize={false} />

      <div className="flex min-h-0 flex-1">
        {/* Panel izquierdo ─ acciones */}
        <div className="flex w-[340px] shrink-0 flex-col overflow-y-auto px-10 py-10">
          {/* Logo + nombre */}
          <div className="mb-10 flex items-center gap-4">
            <AppIcon size={48} />
            <div>
              <div className="text-2xl font-bold tracking-wide text-[#cccccc]">MergeMate</div>
              <div className="text-xs text-[#858585]">Comparador de carpetas</div>
            </div>
          </div>

          {/* Sección: Comenzar */}
          <SectionHeader label="Comenzar" />

          <ActionButton
            icon={<FolderOpen size={18} aria-hidden="true" />}
            label="Comparar 2 carpetas"
            description="Compara archivos entre dos carpetas"
            onClick={handleOpenMain}
          />

          {/* Sección: Próximamente */}
          <SectionHeader label="Próximamente" className="mt-8" />

          <ActionButton
            icon={<FileText size={18} aria-hidden="true" />}
            label="Comparar 2 archivos"
            description="Diff lado a lado de archivos individuales"
            disabled
          />

          <ActionButton
            icon={<GitBranch size={18} aria-hidden="true" />}
            label="Historial de cambios"
            description="Navega el historial de un repositorio Git"
            disabled
          />
        </div>

        {/* Separador vertical */}
        <div className="w-px shrink-0 bg-[#3e3e42]" aria-hidden="true" />

        {/* Panel derecho ─ recientes */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-10">
          <SectionHeader label="Recientes" />

          {recents.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center text-[#858585]">
              <Clock size={32} aria-hidden="true" className="opacity-40" />
              <p className="text-sm">No hay comparaciones recientes</p>
              <p className="text-xs text-[#555555]">Las comparaciones que realices aparecerán aquí</p>
            </div>
          ) : (
            <ul className="mt-2 flex flex-col gap-0.5" role="list" aria-label="Comparaciones recientes">
              {recents.map((r, i) => (
                <li key={i}>
                  <button
                    className="group flex w-full items-start gap-3 rounded px-3 py-2.5 text-left transition-colors hover:bg-[#2a2d2e] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#007acc]"
                    onClick={() => handleOpenRecent(r)}
                    aria-label={`Abrir comparación: ${basename(r.left)} y ${basename(r.right)}`}
                  >
                    <FolderOpen size={16} className="mt-0.5 shrink-0 text-[#007acc]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-[#cccccc]">
                          {basename(r.left)}
                        </span>
                        <ArrowRight size={12} className="shrink-0 text-[#555555]" aria-hidden="true" />
                        <span className="truncate text-sm font-medium text-[#cccccc]">
                          {basename(r.right)}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-[#858585]">{r.left}</div>
                      <div className="truncate text-xs text-[#858585]">{r.right}</div>
                      <div className="mt-1 text-xs text-[#555555]">{timeAgo(r.lastUsed)}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes internos ──────────────────────────────────────────────────

function SectionHeader({ label, className = '' }: { label: string; className?: string }): React.JSX.Element {
  return (
    <h2 className={`mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#858585] ${className}`}>
      {label}
    </h2>
  )
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  description: string
  onClick?: () => void
  disabled?: boolean
}

function ActionButton({ icon, label, description, onClick, disabled = false }: ActionButtonProps): React.JSX.Element {
  return (
    <button
      className="mb-1 flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition-colors
        enabled:hover:bg-[#2a2d2e] enabled:focus-visible:outline-none enabled:focus-visible:ring-1 enabled:focus-visible:ring-[#007acc]
        disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <span className="shrink-0 text-[#007acc]">{icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-[#cccccc]">{label}</div>
        <div className="text-xs text-[#858585]">{description}</div>
      </div>
    </button>
  )
}
