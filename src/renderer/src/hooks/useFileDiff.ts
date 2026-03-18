import { useState, useCallback } from 'react'
import type { FileEntry } from '../types'

interface UseFileDiffReturn {
  selectedFile: FileEntry | null
  leftContent: string
  rightContent: string
  loading: boolean
  openFile: (file: FileEntry) => Promise<void>
  closeFile: () => void
  saveLeft: (content: string) => Promise<void>
  saveRight: (content: string) => Promise<void>
  copyToRight: (leftContent: string) => Promise<boolean>
  copyToLeft: (rightContent: string) => Promise<boolean>
}

export function useFileDiff(onFileUpdated?: (file: FileEntry) => void): UseFileDiffReturn {
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [leftContent, setLeftContent] = useState('')
  const [rightContent, setRightContent] = useState('')
  const [loading, setLoading] = useState(false)

  const openFile = useCallback(async (file: FileEntry) => {
    setLoading(true)
    try {
      const [left, right] = await Promise.all([
        file.leftPath ? window.electronAPI.readFile(file.leftPath) : Promise.resolve(''),
        file.rightPath ? window.electronAPI.readFile(file.rightPath) : Promise.resolve('')
      ])
      setLeftContent(left)
      setRightContent(right)
      setSelectedFile(file)
    } finally {
      setLoading(false)
    }
  }, [])

  const closeFile = useCallback(() => {
    setSelectedFile(null)
    setLeftContent('')
    setRightContent('')
  }, [])

  const saveLeft = useCallback(
    async (content: string) => {
      if (!selectedFile?.leftPath) return
      await window.electronAPI.writeFile(selectedFile.leftPath, content)
      setLeftContent(content)
    },
    [selectedFile]
  )

  const saveRight = useCallback(
    async (content: string) => {
      if (!selectedFile?.rightPath) return
      await window.electronAPI.writeFile(selectedFile.rightPath, content)
      setRightContent(content)
    },
    [selectedFile]
  )

  const copyToRight = useCallback(
    async (content: string): Promise<boolean> => {
      if (!selectedFile?.leftPath || !selectedFile?.rightPath) return false
      const fileName = selectedFile.name
      const destFolder = selectedFile.rightPath.replace(/[/\\][^/\\]+$/, '')
      const confirmed = window.confirm(
        `¿Sobreescribir "${fileName}" en "${destFolder}"?\nSe creará una copia de seguridad .bak automáticamente.`
      )
      if (!confirmed) return false
      await window.electronAPI.copyFileWithBak(selectedFile.leftPath, selectedFile.rightPath)
      setRightContent(content)
      if (onFileUpdated) onFileUpdated({ ...selectedFile, status: 'identical' })
      return true
    },
    [selectedFile, onFileUpdated]
  )

  const copyToLeft = useCallback(
    async (content: string): Promise<boolean> => {
      if (!selectedFile?.leftPath || !selectedFile?.rightPath) return false
      const fileName = selectedFile.name
      const destFolder = selectedFile.leftPath.replace(/[/\\][^/\\]+$/, '')
      const confirmed = window.confirm(
        `¿Sobreescribir "${fileName}" en "${destFolder}"?\nSe creará una copia de seguridad .bak automáticamente.`
      )
      if (!confirmed) return false
      await window.electronAPI.copyFileWithBak(selectedFile.rightPath, selectedFile.leftPath)
      setLeftContent(content)
      if (onFileUpdated) onFileUpdated({ ...selectedFile, status: 'identical' })
      return true
    },
    [selectedFile, onFileUpdated]
  )

  return {
    selectedFile,
    leftContent,
    rightContent,
    loading,
    openFile,
    closeFile,
    saveLeft,
    saveRight,
    copyToRight,
    copyToLeft
  }
}
