/**
 * Strips comments from source code based on file extension.
 */

type CommentStyle = 'c_style' | 'python' | 'hash_style'

const C_STYLE_EXTENSIONS = new Set([
  'js', 'ts', 'jsx', 'tsx', 'java', 'kt', 'kts', 'c', 'cpp', 'cc', 'cs', 'h', 'hpp'
])

const PYTHON_EXTENSIONS = new Set(['py'])

function getCommentStyle(ext: string): CommentStyle {
  if (C_STYLE_EXTENSIONS.has(ext)) return 'c_style'
  if (PYTHON_EXTENSIONS.has(ext)) return 'python'
  return 'hash_style'
}

function stripCStyleComments(source: string): string {
  // Remove /* ... */ blocks
  let result = source.replace(/\/\*[\s\S]*?\*\//g, '')
  // Remove // to end of line (not inside strings — simplified)
  result = result.replace(/\/\/[^\n]*/g, '')
  return result
}

function stripPythonComments(source: string): string {
  // Remove triple-quoted docstrings (only at statement level — start of line after optional indent)
  let result = source.replace(/^(\s*)"""[\s\S]*?"""/gm, '$1')
  result = result.replace(/^(\s*)'''[\s\S]*?'''/gm, '$1')
  // Remove # comments
  result = result.replace(/#[^\n]*/g, '')
  return result
}

function stripHashComments(source: string): string {
  return source.replace(/#[^\n]*/g, '')
}

export function normalize(source: string, ext: string): string {
  const style = getCommentStyle(ext.toLowerCase().replace(/^\./, ''))

  let stripped: string
  switch (style) {
    case 'c_style':
      stripped = stripCStyleComments(source)
      break
    case 'python':
      stripped = stripPythonComments(source)
      break
    default:
      stripped = stripHashComments(source)
  }

  // Trim trailing whitespace from each line
  const lines = stripped.split('\n').map((l) => l.trimEnd())

  // Collapse multiple blank lines into one
  const collapsed: string[] = []
  let prevBlank = false
  for (const line of lines) {
    const isBlank = line.trim() === ''
    if (isBlank && prevBlank) continue
    collapsed.push(line)
    prevBlank = isBlank
  }

  // Trim leading/trailing blank lines
  while (collapsed.length > 0 && collapsed[0].trim() === '') collapsed.shift()
  while (collapsed.length > 0 && collapsed[collapsed.length - 1].trim() === '') collapsed.pop()

  return collapsed.join('\n')
}
