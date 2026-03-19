import React from 'react'
import { X, FolderOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileTypeIcon } from './FileTypeIcon'

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
  if (tabs.length === 0) return <></>

  return (
    <div
      className="flex overflow-x-auto border-b border-[#3e3e42] bg-[#2d2d2d]"
      style={{ minHeight: 35, maxHeight: 35 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const icon = tab.id === 'comparison'
            ? <FolderOpen size={13} className="flex-shrink-0" />
            : tab.loading
              ? <span className="flex-shrink-0 text-xs">⏳</span>
              : <FileTypeIcon extension={tab.extension} size={14} />

          return (
            <motion.div
              key={tab.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16, transition: { duration: 0.12 } }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="group flex flex-shrink-0 cursor-pointer select-none items-center gap-1.5 border-r border-[#3e3e42] px-3 text-xs transition-colors"
              style={{
                backgroundColor: isActive ? '#1e1e1e' : '#2d2d2d',
                color: isActive ? '#ffffff' : '#969696',
                borderTop: isActive ? '1px solid #007acc' : '1px solid transparent',
                minWidth: 80,
                maxWidth: 200,
              }}
              onClick={() => onSelectTab(tab.id)}
              onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); onCloseTab(tab.id) } }}
              title={tab.id}
            >
              {icon}
              <span className="flex-1 truncate">{tab.label}</span>
              <button
                className="ml-1 flex-shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-[#5a5a5a] group-hover:opacity-100"
                style={{ opacity: isActive ? 1 : undefined }}
                onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id) }}
                title="Cerrar"
                aria-label={`Cerrar ${tab.label}`}
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
