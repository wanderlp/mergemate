import * as crypto from 'crypto'
import * as fs from 'fs'
import { normalize } from './commentStripper'
import type { FileStatus } from '../types'

export function hashFile(filePath: string): string {
  const buf = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

export function classifyFiles(
  leftPath: string | null,
  rightPath: string | null,
  ext: string
): FileStatus {
  if (!leftPath && rightPath) return 'right-only'
  if (leftPath && !rightPath) return 'left-only'
  if (!leftPath || !rightPath) return 'left-only'

  // Step 1: hash comparison
  const leftHash = hashFile(leftPath)
  const rightHash = hashFile(rightPath)
  if (leftHash === rightHash) return 'identical'

  // Step 2: comment-stripped comparison
  try {
    const leftContent = fs.readFileSync(leftPath, 'utf-8')
    const rightContent = fs.readFileSync(rightPath, 'utf-8')
    const leftNorm = normalize(leftContent, ext)
    const rightNorm = normalize(rightContent, ext)
    if (leftNorm === rightNorm) return 'comments-only'
  } catch {
    // binary files or read errors — treat as different
  }

  return 'different'
}
