/**
 * Strips comments from source code based on file extension.
 *
 * For C-style languages, uses a small state machine that respects:
 * - String literals (single, double, template)
 * - Regex literals (when preceded by an operator — heuristic)
 * - Block comments (slash-star ... star-slash)
 * - Line comments (slash-slash to end of line)
 */

type CommentStyle = 'c_style' | 'python' | 'hash_style' | 'sql_style' | 'lua_style' | 'ruby_style'

const C_STYLE_EXTENSIONS = new Set([
  'js', 'ts', 'jsx', 'tsx', 'java', 'kt', 'kts', 'c', 'cpp', 'cc', 'cs', 'h', 'hpp',
  'hcl'
])

const PYTHON_EXTENSIONS = new Set(['py'])

const SQL_EXTENSIONS = new Set(['sql'])

const LUA_EXTENSIONS = new Set(['lua'])

const RUBY_EXTENSIONS = new Set(['rb'])

function getCommentStyle(ext: string): CommentStyle {
  const e = ext.toLowerCase().replace(/^\./, '')
  if (C_STYLE_EXTENSIONS.has(e)) return 'c_style'
  if (PYTHON_EXTENSIONS.has(e)) return 'python'
  if (SQL_EXTENSIONS.has(e)) return 'sql_style'
  if (LUA_EXTENSIONS.has(e)) return 'lua_style'
  if (RUBY_EXTENSIONS.has(e)) return 'ruby_style'
  return 'hash_style'
}

function canStartRegex(prev: string): boolean {
  if (prev === '') return true
  return /[=([,!?;{}&|+*^~<>:%]/.test(prev)
}

function stripCStyleComments(source: string): string {
  let result = ''
  let i = 0
  const n = source.length
  let lastSig = ''
  type State = 'code' | 'line' | 'block' | 'dstr' | 'sstr' | 'tpl' | 're'
  let state: State = 'code'

  while (i < n) {
    const c = source[i]
    const c2 = i + 1 < n ? source[i + 1] : ''

    if (state === 'line') {
      if (c === '\n') {
        result += c
        i++
        state = 'code'
        lastSig = c
      } else {
        i++
      }
    } else if (state === 'block') {
      if (c === '*' && c2 === '/') {
        i += 2
        state = 'code'
      } else {
        i++
      }
    } else if (state === 'dstr') {
      result += c
      if (c === '\\' && i + 1 < n) {
        result += c2
        i += 2
      } else if (c === '"') {
        i++
        state = 'code'
        lastSig = '"'
      } else {
        i++
      }
    } else if (state === 'sstr') {
      result += c
      if (c === '\\' && i + 1 < n) {
        result += c2
        i += 2
      } else if (c === "'") {
        i++
        state = 'code'
        lastSig = "'"
      } else {
        i++
      }
    } else if (state === 'tpl') {
      result += c
      if (c === '\\' && i + 1 < n) {
        result += c2
        i += 2
      } else if (c === '`') {
        i++
        state = 'code'
        lastSig = '`'
      } else {
        i++
      }
    } else if (state === 're') {
      if (c === '\\' && i + 1 < n) {
        result += c + c2
        i += 2
      } else if (c === '[') {
        result += c
        i++
        while (i < n && source[i] !== ']') {
          if (source[i] === '\\' && i + 1 < n) {
            result += source[i] + source[i + 1]
            i += 2
          } else {
            result += source[i]
            i++
          }
        }
        if (i < n) { result += source[i]; i++ }
      } else if (c === '/') {
        result += c
        i++
        state = 'code'
        while (i < n && /[gimsuyn]/.test(source[i])) {
          result += source[i]
          i++
        }
        lastSig = '/'
      } else {
        result += c
        i++
      }
    } else {
      if (c === '/' && c2 === '/') {
        i += 2
        state = 'line'
      } else if (c === '/' && c2 === '*') {
        i += 2
        state = 'block'
      } else if (c === '"') {
        result += c
        i++
        state = 'dstr'
        lastSig = c
      } else if (c === "'") {
        result += c
        i++
        state = 'sstr'
        lastSig = c
      } else if (c === '`') {
        result += c
        i++
        state = 'tpl'
        lastSig = c
      } else if (c === '/' && canStartRegex(lastSig)) {
        result += c
        i++
        state = 're'
        lastSig = c
      } else {
        result += c
        if (!/\s/.test(c)) lastSig = c
        i++
      }
    }
  }

  return result
}

function stripPythonComments(source: string): string {
  let result = source.replace(/^(\s*)"""[\s\S]*?"""/gm, '$1')
  result = result.replace(/^(\s*)'''[\s\S]*?'''/gm, '$1')
  result = result.replace(/#[^\n]*/g, '')
  return result
}

function stripHashComments(source: string): string {
  return source.replace(/#[^\n]*/g, '')
}

function stripSqlComments(source: string): string {
  let result = source.replace(/\/\*[\s\S]*?\*\//g, '')
  result = result.replace(/--[^\n]*/g, '')
  return result
}

function stripLuaComments(source: string): string {
  let result = source.replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, '')
  result = result.replace(/--[^\n]*/g, '')
  return result
}

function stripRubyComments(source: string): string {
  let result = source.replace(/^=begin[\s\S]*?^=end$/gm, '')
  result = result.replace(/#[^\n]*/g, '')
  return result
}

export function normalize(source: string, ext: string): string {
  const style = getCommentStyle(ext)

  let stripped: string
  switch (style) {
    case 'c_style':   stripped = stripCStyleComments(source); break
    case 'python':    stripped = stripPythonComments(source); break
    case 'sql_style': stripped = stripSqlComments(source); break
    case 'lua_style': stripped = stripLuaComments(source); break
    case 'ruby_style':stripped = stripRubyComments(source); break
    default:          stripped = stripHashComments(source)
  }

  const lines = stripped.split('\n').map((l) => l.trimEnd())

  const collapsed: string[] = []
  let prevBlank = false
  for (const line of lines) {
    const isBlank = line.trim() === ''
    if (isBlank && prevBlank) continue
    collapsed.push(line)
    prevBlank = isBlank
  }

  while (collapsed.length > 0 && collapsed[0].trim() === '') collapsed.shift()
  while (collapsed.length > 0 && collapsed[collapsed.length - 1].trim() === '') collapsed.pop()

  return collapsed.join('\n')
}
