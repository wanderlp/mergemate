import * as fs from 'fs'
import * as path from 'path'
import { classifyFiles } from './classifier'
import type { FileEntry, ScanResult, ScanStats } from '../types'

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '__pycache__', 'dist', 'build',
  '.next', 'out', 'target', '.gradle', '.idea', '.vscode'
])

function shouldIgnore(name: string): boolean {
  if (IGNORE_DIRS.has(name)) return true
  if (name.endsWith('.bak')) return true
  return false
}

function collectPaths(dir: string, base: string, result: Map<string, string>): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue
    const rel = path.join(base, entry.name).replace(/\\/g, '/')
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.set(rel + '/', full)
      collectPaths(full, rel, result)
    } else {
      result.set(rel, full)
    }
  }
}

function buildTree(
  allPaths: Set<string>,
  leftMap: Map<string, string>,
  rightMap: Map<string, string>,
  onProgress: (file: string) => void
): { entries: FileEntry[]; stats: ScanStats } {
  const stats: ScanStats = { identical: 0, different: 0, commentsOnly: 0, leftOnly: 0, rightOnly: 0, total: 0 }

  // Build flat list of all unique relative paths (files only, no dir keys here)
  const filePaths = Array.from(allPaths).filter((p) => !p.endsWith('/'))

  // Build directory structure
  const dirMap = new Map<string, FileEntry>()
  const rootEntries: FileEntry[] = []

  function getOrCreateDir(relDir: string): FileEntry {
    if (dirMap.has(relDir)) return dirMap.get(relDir)!
    const parts = relDir.split('/').filter(Boolean)
    const name = parts[parts.length - 1]
    const entry: FileEntry = {
      relativePath: relDir,
      leftPath: leftMap.get(relDir + '/') ?? null,
      rightPath: rightMap.get(relDir + '/') ?? null,
      status: 'identical',
      isDirectory: true,
      children: [],
      name,
      extension: ''
    }
    dirMap.set(relDir, entry)
    const parentDir = parts.slice(0, -1).join('/')
    if (parentDir === '') {
      rootEntries.push(entry)
    } else {
      const parent = getOrCreateDir(parentDir)
      parent.children!.push(entry)
    }
    return entry
  }

  for (const rel of filePaths) {
    onProgress(rel)
    const ext = path.extname(rel).replace('.', '').toLowerCase()
    const leftPath = leftMap.get(rel) ?? null
    const rightPath = rightMap.get(rel) ?? null
    const status = classifyFiles(leftPath, rightPath, ext)

    stats.total++
    if (status === 'identical') stats.identical++
    else if (status === 'different') stats.different++
    else if (status === 'comments-only') stats.commentsOnly++
    else if (status === 'left-only') stats.leftOnly++
    else if (status === 'right-only') stats.rightOnly++

    const parts = rel.split('/')
    const name = parts[parts.length - 1]
    const fileEntry: FileEntry = {
      relativePath: rel,
      leftPath,
      rightPath,
      status,
      isDirectory: false,
      name,
      extension: ext
    }

    if (parts.length === 1) {
      rootEntries.push(fileEntry)
    } else {
      const parentDir = parts.slice(0, -1).join('/')
      const parent = getOrCreateDir(parentDir)
      parent.children!.push(fileEntry)
    }
  }

  // Sort: dirs first, then files, alphabetically
  function sortEntries(entries: FileEntry[]): void {
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
    for (const e of entries) {
      if (e.children) sortEntries(e.children)
    }
  }
  sortEntries(rootEntries)

  // Compute folder status: the most prevalent status among all descendant files
  function countDescendantStatuses(entry: FileEntry, counts: Record<string, number>): void {
    if (!entry.children) return
    for (const child of entry.children) {
      if (child.isDirectory) {
        countDescendantStatuses(child, counts)
      } else {
        counts[child.status] = (counts[child.status] ?? 0) + 1
      }
    }
  }

  function computeDirStatus(entry: FileEntry): void {
    if (!entry.isDirectory || !entry.children) return
    for (const child of entry.children) {
      computeDirStatus(child)
    }
    const counts: Record<string, number> = {}
    countDescendantStatuses(entry, counts)
    if (Object.keys(counts).length === 0) {
      entry.status = 'identical'
      return
    }
    // Verde solo si TODOS los descendientes son idénticos
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    if ((counts['identical'] ?? 0) === total) {
      entry.status = 'identical'
      return
    }
    // De lo contrario, el color predominante excluyendo verde
    const nonIdentical = Object.entries(counts).filter(([k]) => k !== 'identical')
    const dominant = nonIdentical.sort((a, b) => b[1] - a[1])[0][0]
    entry.status = dominant as FileEntry['status']
  }
  for (const entry of rootEntries) {
    computeDirStatus(entry)
  }

  return { entries: rootEntries, stats }
}

export function scanFolders(
  leftFolder: string,
  rightFolder: string,
  onProgress: (percent: number, currentFile: string) => void
): ScanResult {
  const leftMap = new Map<string, string>()
  const rightMap = new Map<string, string>()

  collectPaths(leftFolder, '', leftMap)
  collectPaths(rightFolder, '', rightMap)

  const allPaths = new Set([...leftMap.keys(), ...rightMap.keys()])
  const total = allPaths.size
  let processed = 0

  const { entries, stats } = buildTree(allPaths, leftMap, rightMap, (file) => {
    processed++
    onProgress(Math.round((processed / total) * 100), file)
  })

  return { files: entries, stats }
}
