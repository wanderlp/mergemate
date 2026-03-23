import React, { useId, useState, useEffect } from 'react'
import { Minus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'es', label: 'ES — Español' },
  { code: 'en', label: 'EN — English' },
  { code: 'pt', label: 'PT — Português' },
  { code: 'de', label: 'DE — Deutsch' },
  { code: 'fr', label: 'FR — Français' },
]

export function AppIcon({ size = 24 }: { size?: number }): React.JSX.Element {
  const uid = useId().replace(/:/g, '')
  const gradId = `${uid}-bg`
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a8cd8"/>
          <stop offset="100%" stopColor="#005a9e"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="100" fill={`url(#${gradId})`}/>
      <path d="M 60,148 L 188,148 L 228,188 L 228,364 L 60,364 Z" fill="white" opacity="0.95"/>
      <path d="M 188,148 L 228,148 L 228,188 Z" fill="#c8dff0"/>
      <line x1="188" y1="148" x2="228" y2="188" stroke="#a0c4e0" strokeWidth="1.5"/>
      <rect x="84"  y="216" width="104" height="14" rx="7" fill="#ef4444"/>
      <rect x="84"  y="248" width="76"  height="14" rx="7" fill="#c8d8ea"/>
      <rect x="84"  y="280" width="92"  height="14" rx="7" fill="#ef4444"/>
      <path d="M 284,148 L 412,148 L 452,188 L 452,364 L 284,364 Z" fill="white" opacity="0.95"/>
      <path d="M 412,148 L 452,148 L 452,188 Z" fill="#c8dff0"/>
      <line x1="412" y1="148" x2="452" y2="188" stroke="#a0c4e0" strokeWidth="1.5"/>
      <rect x="308" y="216" width="104" height="14" rx="7" fill="#22c55e"/>
      <rect x="308" y="248" width="76"  height="14" rx="7" fill="#c8d8ea"/>
      <rect x="308" y="280" width="92"  height="14" rx="7" fill="#22c55e"/>
      <line x1="238" y1="232" x2="278" y2="232" stroke="white" strokeWidth="13" strokeLinecap="round"/>
      <path d="M 263,214 L 294,232 L 263,250 Z" fill="white"/>
      <line x1="274" y1="280" x2="234" y2="280" stroke="white" strokeWidth="13" strokeLinecap="round"/>
      <path d="M 249,262 L 218,280 L 249,298 Z" fill="white"/>
    </svg>
  )
}

function MaximizeIcon(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="10" height="10" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

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

interface TitleBarProps {
  showMaximize?: boolean
}

export function TitleBar({ showMaximize = true }: TitleBarProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMaximized)
    return window.electronAPI.onMaximizeChange(setIsMaximized)
  }, [])

  return (
    <div
      role="banner"
      aria-label={t('titleBar.ariaLabel')}
      className="flex shrink-0 select-none items-center border-b border-[#3e3e42] bg-[#252526]"
      style={{ height: 40, ...DRAG }}
    >
      <div className="flex items-center gap-2.5 px-3">
        <AppIcon size={24} />
        <span className="text-sm font-semibold tracking-wide text-[#cccccc]">MergeMate</span>
      </div>

      <div className="ml-auto flex h-full items-center" style={NO_DRAG}>
        {/* Selector de idioma */}
        <select
          value={i18n.resolvedLanguage}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          aria-label={t('titleBar.switchLanguage')}
          title={t('titleBar.switchLanguage')}
          tabIndex={-1}
          className="h-full cursor-pointer bg-transparent px-2 text-sm text-[#aaaaaa] transition-colors hover:bg-[#3e3e42] hover:text-[#cccccc] focus:outline-none"
          style={{ border: 'none' }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} style={{ backgroundColor: '#2d2d2d', color: '#cccccc' }}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          className="flex h-full w-[46px] items-center justify-center text-[#aaaaaa] transition-colors hover:bg-[#3e3e42] hover:text-[#cccccc]"
          onClick={() => window.electronAPI.minimizeWindow()}
          aria-label={t('titleBar.minimize')}
          tabIndex={-1}
        >
          <Minus size={13} aria-hidden="true" />
        </button>

        {showMaximize && (
          <button
            className="flex h-full w-[46px] items-center justify-center text-[#aaaaaa] transition-colors hover:bg-[#3e3e42] hover:text-[#cccccc]"
            onClick={() => window.electronAPI.maximizeWindow()}
            aria-label={isMaximized ? t('titleBar.restore') : t('titleBar.maximize')}
            tabIndex={-1}
          >
            {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
          </button>
        )}

        <button
          className="flex h-full w-[46px] items-center justify-center text-[#aaaaaa] transition-colors hover:bg-[#e81123] hover:text-white"
          onClick={() => window.electronAPI.closeWindow()}
          aria-label={t('titleBar.close')}
          tabIndex={-1}
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
