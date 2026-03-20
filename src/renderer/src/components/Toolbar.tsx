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
  onRefresh: () => void
  scanning: boolean
}

function FolderPath({ path }: { path: string }): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="flex-1 truncate rounded bg-[#1e1e1e] px-3 py-2 text-sm text-[#aaaaaa]">
      {path || t('toolbar.noFolder')}
    </div>
  )
}

export function Toolbar({
  leftFolder,
  rightFolder,
  onOpenLeft,
  onOpenRight,
  onRefresh,
  scanning
}: ToolbarProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2 border-b border-[#3e3e42] bg-[#252526] px-3 py-2">
      <Button
        onClick={onOpenLeft}
        disabled={scanning}
        title={t('toolbar.openLeftTooltip')}
        aria-label={t('toolbar.openLeft')}
      >
        <FolderOpen size={16} aria-hidden="true" />
        {t('toolbar.openLeft')}
      </Button>

      <FolderPath path={leftFolder} />

      <Button
        onClick={onOpenRight}
        disabled={scanning}
        title={t('toolbar.openRightTooltip')}
        aria-label={t('toolbar.openRight')}
      >
        <FolderOpen size={16} aria-hidden="true" />
        {t('toolbar.openRight')}
      </Button>

      <FolderPath path={rightFolder} />

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
