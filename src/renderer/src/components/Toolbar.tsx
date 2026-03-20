import React from 'react'
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && leftFolder && rightFolder) onRefresh()
  }

  return (
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
        onClick={onRefresh}
        disabled={scanning || !leftFolder || !rightFolder}
        title={t('toolbar.compareTooltip')}
        aria-label={t('toolbar.compare')}
      >
        <GitCompareArrows size={16} aria-hidden="true" />
        {t('toolbar.compare')}
      </Button>
    </div>
  )
}
