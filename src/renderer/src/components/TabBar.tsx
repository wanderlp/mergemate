import React from 'react'
import { X, FolderOpen } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FileTypeIcon } from './FileTypeIcon'
import { COMPARISON_TAB_ID } from '../constants'

export interface TabItem {
  id: string
  label: string
  extension: string
  loading: boolean
}

interface TabBarProps {
  tabs: TabItem[]
  activeTabId: string
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab }: TabBarProps): React.JSX.Element {
  const shouldReduceMotion = useReducedMotion()

  if (tabs.length === 0) return <></>

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string, index: number): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectTab(tabId)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onSelectTab(tabs[(index + 1) % tabs.length].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onSelectTab(tabs[(index - 1 + tabs.length) % tabs.length].id)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onCloseTab(tabId)
    }
  }

  const duration = shouldReduceMotion ? 0 : 0.18

  return (
    <div
      role="tablist"
      aria-label="Archivos abiertos"
      className="flex overflow-x-auto border-b border-[#3e3e42] bg-[#2d2d2d]"
      style={{ minHeight: 35, maxHeight: 35 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId
          const icon = tab.id === COMPARISON_TAB_ID
            ? <FolderOpen size={13} className="flex-shrink-0" aria-hidden="true" />
            : tab.loading
              ? <span className="flex-shrink-0 text-xs" aria-hidden="true">⏳</span>
              : <FileTypeIcon extension={tab.extension} size={14} />

          return (
            <motion.div
              key={tab.id}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-label={tab.label}
              layout
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -16, transition: { duration: shouldReduceMotion ? 0 : 0.12 } }}
              transition={{ duration, ease: 'easeOut' }}
              className="group flex flex-shrink-0 cursor-pointer select-none items-center gap-1.5 border-r border-[#3e3e42] px-3 text-xs transition-colors"
              style={{
                backgroundColor: isActive ? '#1e1e1e' : '#2d2d2d',
                color: isActive ? '#ffffff' : '#969696',
                borderTop: isActive ? '1px solid #007acc' : '1px solid transparent',
                minWidth: 80,
                maxWidth: 200,
              }}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
              onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); onCloseTab(tab.id) } }}
              title={tab.id}
            >
              {icon}
              <span className="flex-1 truncate">{tab.label}</span>
              <button
                className="ml-1 flex-shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-[#5a5a5a] group-hover:opacity-100"
                style={{ opacity: isActive ? 1 : undefined }}
                onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id) }}
                title={`Cerrar ${tab.label}`}
                aria-label={`Cerrar ${tab.label}`}
                tabIndex={-1}
              >
                <X size={12} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
