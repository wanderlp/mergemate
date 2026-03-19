import React from 'react'
import { FolderOpen, GitCompareArrows, Eraser } from 'lucide-react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

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
      <Button
        onClick={onOpenLeft}
        disabled={scanning}
        title="Abrir carpeta izquierda (Ctrl+L)"
        aria-label="Abrir carpeta izquierda"
      >
        <FolderOpen size={16} aria-hidden="true" />
        Abrir carpeta izquierda
      </Button>

      <div className="flex-1 truncate rounded bg-[#1e1e1e] px-3 py-2 text-sm text-[#aaaaaa]">
        {leftFolder || 'Ninguna carpeta seleccionada'}
      </div>

      <Button
        onClick={onOpenRight}
        disabled={scanning}
        title="Abrir carpeta derecha (Ctrl+R)"
        aria-label="Abrir carpeta derecha"
      >
        <FolderOpen size={16} aria-hidden="true" />
        Abrir carpeta derecha
      </Button>

      <div className="flex-1 truncate rounded bg-[#1e1e1e] px-3 py-2 text-sm text-[#aaaaaa]">
        {rightFolder || 'Ninguna carpeta seleccionada'}
      </div>

      <Separator orientation="vertical" className="mx-1" />

      <Button
        onClick={onRefresh}
        disabled={scanning || !leftFolder || !rightFolder}
        title="Comparar carpetas (Ctrl+F5)"
        aria-label="Comparar carpetas"
      >
        <GitCompareArrows size={16} aria-hidden="true" />
        Comparar
      </Button>

      <Button
        onClick={onClear}
        disabled={scanning || (!leftFolder && !rightFolder)}
        title="Limpiar y empezar de nuevo"
        aria-label="Limpiar selección"
      >
        <Eraser size={16} aria-hidden="true" />
        Limpiar
      </Button>
    </div>
  )
}
