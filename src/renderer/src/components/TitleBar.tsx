import React, { useState, useEffect } from 'react'
import { Minus, X } from 'lucide-react'
import { MergeMateLogo } from './MergeMateLogo'

// Icono maximizar: cuadrado simple
function MaximizeIcon(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="10" height="10" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

// Icono restaurar: dos rectángulos superpuestos (estilo Windows)
function RestoreIcon(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <rect x="2.5" y="0.5" width="8" height="8" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="0.5" y="2.5" width="8" height="8" stroke="currentColor" strokeWidth="1.2" fill="#252526"/>
    </svg>
  )
}

const DRAG    = { WebkitAppRegion: 'drag'    } as React.CSSProperties
const NO_DRAG = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

export function TitleBar(): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMaximized)
    return window.electronAPI.onMaximizeChange(setIsMaximized)
  }, [])

  return (
    <div
      role="banner"
      aria-label="Barra de título"
      className="flex shrink-0 select-none items-center border-b border-[#3e3e42] bg-[#252526]"
      style={{ height: 40, ...DRAG }}
    >
      {/* Icono y nombre */}
      <div className="flex items-center gap-2.5 px-3">
        <MergeMateLogo size={34} />
        <span className="text-sm font-semibold tracking-wide text-[#cccccc]">MergeMate</span>
      </div>

      {/* Botones de ventana */}
      <div className="ml-auto flex h-full" style={NO_DRAG}>
        <button
          className="flex h-full w-[46px] items-center justify-center text-[#aaaaaa] transition-colors hover:bg-[#3e3e42] hover:text-[#cccccc]"
          onClick={() => window.electronAPI.minimizeWindow()}
          aria-label="Minimizar"
          tabIndex={-1}
        >
          <Minus size={13} aria-hidden="true" />
        </button>

        <button
          className="flex h-full w-[46px] items-center justify-center text-[#aaaaaa] transition-colors hover:bg-[#3e3e42] hover:text-[#cccccc]"
          onClick={() => window.electronAPI.maximizeWindow()}
          aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
          tabIndex={-1}
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>

        <button
          className="flex h-full w-[46px] items-center justify-center text-[#aaaaaa] transition-colors hover:bg-[#e81123] hover:text-white"
          onClick={() => window.electronAPI.closeWindow()}
          aria-label="Cerrar"
          tabIndex={-1}
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
