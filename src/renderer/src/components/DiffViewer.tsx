import React, { useRef, useCallback, useEffect } from 'react'
import { DiffEditor, type DiffEditorProps } from '@monaco-editor/react'
import { ChevronUp, ChevronDown, ArrowLeftRight, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FileEntry } from '../types'
import type * as monaco from 'monaco-editor'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

interface DiffViewerProps {
  file: FileEntry
  leftContent: string
  rightContent: string
  onSaveLeft: (content: string) => Promise<void>
  onSaveRight: (content: string) => Promise<void>
  onCopyToLeft: (content: string) => Promise<boolean>
  onCopyToRight: (content: string) => Promise<boolean>
}

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python',
  java: 'java',
  kt: 'kotlin', kts: 'kotlin',
  cs: 'csharp',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', hpp: 'cpp',
  json: 'json',
  md: 'markdown',
  html: 'html',
  css: 'css',
  scss: 'scss',
  xml: 'xml',
  yaml: 'yaml', yml: 'yaml',
  sh: 'shell', bash: 'shell',
  rs: 'rust',
  go: 'go',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
}

function detectLanguage(ext: string): string {
  return LANGUAGE_MAP[ext.toLowerCase()] ?? 'plaintext'
}

export function DiffViewer({
  file,
  leftContent,
  rightContent,
  onSaveLeft,
  onSaveRight,
  onCopyToLeft,
  onCopyToRight
}: DiffViewerProps): React.JSX.Element {
  const { t } = useTranslation()
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)
  const language = detectLanguage(file.extension)

  const handleEditorDidMount: DiffEditorProps['onMount'] = useCallback((editor) => {
    editorRef.current = editor
  }, [])

  const navigateDiff = useCallback((direction: 'prev' | 'next') => {
    const editor = editorRef.current
    if (!editor) return
    const action = direction === 'next'
      ? 'editor.action.diffReview.next'
      : 'editor.action.diffReview.prev'
    editor.getModifiedEditor().trigger('keyboard', action, null)
  }, [])

  const handleSaveLeft = useCallback(async () => {
    const editor = editorRef.current
    const content = editor?.getOriginalEditor().getValue() ?? leftContent
    await onSaveLeft(content)
  }, [leftContent, onSaveLeft])

  const handleSaveRight = useCallback(async () => {
    const editor = editorRef.current
    const content = editor?.getModifiedEditor().getValue() ?? rightContent
    await onSaveRight(content)
  }, [rightContent, onSaveRight])

  const handleCopyToRight = useCallback(async () => {
    const editor = editorRef.current
    const content = editor?.getOriginalEditor().getValue() ?? leftContent
    await onCopyToRight(content)
  }, [leftContent, onCopyToRight])

  const handleCopyToLeft = useCallback(async () => {
    const editor = editorRef.current
    const content = editor?.getModifiedEditor().getValue() ?? rightContent
    await onCopyToLeft(content)
  }, [rightContent, onCopyToLeft])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRight()
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        navigateDiff('prev')
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault()
        navigateDiff('next')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSaveRight, navigateDiff])

  const canCopyLeft = Boolean(file.leftPath)
  const canCopyRight = Boolean(file.rightPath)

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <div className="flex items-center gap-2 border-b border-[#3e3e42] bg-[#252526] px-3 py-2">
        <div className="flex-1 truncate text-sm text-[#cccccc]">
          {file.relativePath}
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => navigateDiff('prev')}
            title={t('diff.prevTooltip')}
            aria-label={t('diff.prevAriaLabel')}
          >
            <ChevronUp size={16} aria-hidden="true" />
            {t('diff.prev')}
          </Button>
          <Button
            onClick={() => navigateDiff('next')}
            title={t('diff.nextTooltip')}
            aria-label={t('diff.nextAriaLabel')}
          >
            <ChevronDown size={16} aria-hidden="true" />
            {t('diff.next')}
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1" />

        <Button
          onClick={handleCopyToLeft}
          disabled={!canCopyLeft || !canCopyRight}
          title={t('diff.copyToLeftTooltip')}
          aria-label={t('diff.copyToLeftAriaLabel')}
        >
          <ArrowLeftRight size={16} aria-hidden="true" />{t('diff.copyToLeft')}
        </Button>
        <Button
          onClick={handleCopyToRight}
          disabled={!canCopyLeft || !canCopyRight}
          title={t('diff.copyToRightTooltip')}
          aria-label={t('diff.copyToRightAriaLabel')}
        >
          {t('diff.copyToRight')}<ArrowLeftRight size={16} aria-hidden="true" />
        </Button>

        <Separator orientation="vertical" className="mx-1" />

        <Button
          onClick={handleSaveLeft}
          disabled={!canCopyLeft}
          title={t('diff.saveLeftTooltip')}
          aria-label={t('diff.saveLeftAriaLabel')}
        >
          <Save size={16} aria-hidden="true" />
          {t('diff.saveLeft')}
        </Button>
        <Button
          onClick={handleSaveRight}
          disabled={!canCopyRight}
          title={t('diff.saveRightTooltip')}
          aria-label={t('diff.saveRightAriaLabel')}
        >
          <Save size={16} aria-hidden="true" />
          {t('diff.saveRight')}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <DiffEditor
          original={leftContent}
          modified={rightContent}
          language={language}
          theme="vs-dark"
          options={{
            readOnly: false,
            renderSideBySide: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: true },
            fontSize: 15,
            lineNumbers: 'on',
            scrollbar: { vertical: 'auto', horizontal: 'auto' },
            diffAlgorithm: 'advanced',
            originalEditable: true,
          }}
          onMount={handleEditorDidMount}
          height="100%"
        />
      </div>
    </div>
  )
}
