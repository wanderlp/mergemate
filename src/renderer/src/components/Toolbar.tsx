import React, { useState } from 'react'
import { FolderOpen, GitCompareArrows } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

interface ToolbarProps {
  leftFolder: string
  rightFolder: string
  onOpenLeft: () => void
  onOpenRight: () => void
  onChangeLeft: (path: string) => void
  onChangeRight: (path: string) => void
  onRefresh: () => void
  scanning: boolean
}

export function Toolbar({
  leftFolder,
  rightFolder,
  onOpenLeft,
  onOpenRight,
  onChangeLeft,
  onChangeRight,
  onRefresh,
  scanning
}: ToolbarProps): React.JSX.Element {
  const { t } = useTranslation()
  const [missingFolders, setMissingFolders] = useState<string[]>([])

  async function handleCompare(): Promise<void> {
    if (!leftFolder || !rightFolder) return

    const [leftExists, rightExists] = await Promise.all([
      window.electronAPI.folderExists(leftFolder),
      window.electronAPI.folderExists(rightFolder)
    ])

    const missing: string[] = []
    if (!leftExists) missing.push(leftFolder)
    if (!rightExists) missing.push(rightFolder)

    if (missing.length > 0) {
      setMissingFolders(missing)
      return
    }

    onRefresh()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' && leftFolder && rightFolder) handleCompare()
  }

  function handleConfirm(): void {
    setMissingFolders([])
    onRefresh()
  }

  return (
    <>
      {missingFolders.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="folder-not-found-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#3e3e42] bg-[#252526] p-6 shadow-2xl">
            <h2 id="folder-not-found-title" className="mb-2 text-base font-semibold text-[#cccccc]">
              {t('toolbar.folderNotFoundTitle')}
            </h2>
            <p className="mb-3 text-sm text-[#aaaaaa]">
              {t('toolbar.folderNotFoundMessage', { count: missingFolders.length })}
            </p>
            <ul className="mb-6 space-y-1">
              {missingFolders.map((p) => (
                <li
                  key={p}
                  className="truncate rounded bg-[#1e1e1e] px-3 py-1.5 font-mono text-xs text-[#cccccc]"
                  title={p}
                >
                  {p}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                className="rounded px-3 py-1.5 text-sm text-[#aaaaaa] transition-colors hover:bg-[#3e3e42] hover:text-[#cccccc]"
                onClick={() => setMissingFolders([])}
                autoFocus
              >
                {t('toolbar.folderNotFoundCancel')}
              </button>
              <button
                className="rounded bg-[#007acc] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#005fa3]"
                onClick={handleConfirm}
              >
                {t('toolbar.folderNotFoundContinue')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-[#3e3e42] bg-[#252526] px-3 py-2">
        <Button
          onClick={onOpenLeft}
          disabled={scanning}
          title={leftFolder ? t('toolbar.changeLeftTooltip') : t('toolbar.openLeftTooltip')}
          aria-label={leftFolder ? t('toolbar.changeLeft') : t('toolbar.openLeft')}
        >
          <FolderOpen size={16} aria-hidden="true" />
          {leftFolder ? t('toolbar.changeLeft') : t('toolbar.openLeft')}
        </Button>

        <input
          className="flex-1 truncate rounded bg-[#1e1e1e] px-3 py-2 text-sm text-[#aaaaaa] placeholder-[#555] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
          value={leftFolder}
          onChange={(e) => onChangeLeft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('toolbar.noFolder')}
          aria-label={leftFolder ? t('toolbar.changeLeft') : t('toolbar.openLeft')}
          disabled={scanning}
          spellCheck={false}
        />

        <Button
          onClick={onOpenRight}
          disabled={scanning}
          title={rightFolder ? t('toolbar.changeRightTooltip') : t('toolbar.openRightTooltip')}
          aria-label={rightFolder ? t('toolbar.changeRight') : t('toolbar.openRight')}
        >
          <FolderOpen size={16} aria-hidden="true" />
          {rightFolder ? t('toolbar.changeRight') : t('toolbar.openRight')}
        </Button>

        <input
          className="flex-1 truncate rounded bg-[#1e1e1e] px-3 py-2 text-sm text-[#aaaaaa] placeholder-[#555] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
          value={rightFolder}
          onChange={(e) => onChangeRight(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('toolbar.noFolder')}
          aria-label={rightFolder ? t('toolbar.changeRight') : t('toolbar.openRight')}
          disabled={scanning}
          spellCheck={false}
        />

        <Separator orientation="vertical" className="mx-1" />

        <Button
          onClick={handleCompare}
          disabled={scanning || !leftFolder || !rightFolder}
          title={t('toolbar.compareTooltip')}
          aria-label={t('toolbar.compare')}
        >
          <GitCompareArrows size={16} aria-hidden="true" />
          {t('toolbar.compare')}
        </Button>
      </div>
    </>
  )
}
