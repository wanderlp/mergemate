import React from 'react'
import { FolderOpen, GitCompareArrows, Eraser } from 'lucide-react'

interface ToolbarProps {
  leftFolder: string
  rightFolder: string
  onOpenLeft: () => void
  onOpenRight: () => void
  onRefresh: () => void
  onClear: () => void
  scanning: boolean
}

export function Toolbar({
  leftFolder,
  rightFolder,
  onOpenLeft,
  onOpenRight,
  onRefresh,
  onClear,
  scanning
}: ToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 border-b border-[#3e3e42] bg-[#252526] px-3 py-2">
      <button
        onClick={onOpenLeft}
        disabled={scanning}
        className="flex items-center gap-2 rounded bg-[#3e3e42] px-4 py-2 text-sm text-[#cccccc] hover:bg-[#505050] disabled:opacity-50 transition-colors"
        title="Abrir carpeta izquierda (Ctrl+L)"
        aria-label="Abrir carpeta izquierda"
      >
        <FolderOpen size={16} />
        Abrir carpeta izquierda
      </button>

      <div className="flex-1 truncate rounded bg-[#1e1e1e] px-3 py-2 text-sm text-[#aaaaaa]">
        {leftFolder || 'Ninguna carpeta seleccionada'}
      </div>

      <button
        onClick={onOpenRight}
        disabled={scanning}
        className="flex items-center gap-2 rounded bg-[#3e3e42] px-4 py-2 text-sm text-[#cccccc] hover:bg-[#505050] disabled:opacity-50 transition-colors"
        title="Abrir carpeta derecha (Ctrl+R)"
        aria-label="Abrir carpeta derecha"
      >
        <FolderOpen size={16} />
        Abrir carpeta derecha
      </button>

      <div className="flex-1 truncate rounded bg-[#1e1e1e] px-3 py-2 text-sm text-[#aaaaaa]">
        {rightFolder || 'Ninguna carpeta seleccionada'}
      </div>

      <button
        onClick={onRefresh}
        disabled={scanning || !leftFolder || !rightFolder}
        className="flex items-center gap-2 rounded bg-[#3e3e42] px-4 py-2 text-sm text-[#cccccc] hover:bg-[#505050] disabled:opacity-50 transition-colors"
        title="Comparar carpetas (Ctrl+F5)"
        aria-label="Comparar carpetas"
      >
        <GitCompareArrows size={16} />
        Comparar
      </button>

      <button
        onClick={onClear}
        disabled={scanning || (!leftFolder && !rightFolder)}
        className="flex items-center gap-2 rounded bg-[#3e3e42] px-4 py-2 text-sm text-[#cccccc] hover:bg-[#505050] disabled:opacity-50 transition-colors"
        title="Limpiar y empezar de nuevo"
        aria-label="Limpiar selección"
      >
        <Eraser size={16} />
        Limpiar
      </button>
    </div>
  )
}
