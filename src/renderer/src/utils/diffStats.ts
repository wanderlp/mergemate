import DiffMatchPatch from 'diff-match-patch'

export interface DiffStats {
  identical: number    // líneas iguales
  different: number    // líneas modificadas (DELETE + INSERT adyacentes)
  commentsOnly: number // reservado — siempre 0 a nivel de línea
  leftOnly: number     // líneas solo en izquierda (eliminadas)
  rightOnly: number    // líneas solo en derecha (añadidas)
  total: number        // máximo entre izquierda y derecha
}

const MAX_LINES = 8000

function countLines(text: string): number {
  return text.split('\n').filter((l) => l !== '').length
}

export function computeDiffStats(left: string, right: string): DiffStats {
  const leftLines  = left  ? left.split('\n').length  : 0
  const rightLines = right ? right.split('\n').length : 0
  const total = Math.max(leftLines, rightLines)

  if (!left && !right) return { identical: 0, different: 0, commentsOnly: 0, leftOnly: 0, rightOnly: 0, total: 0 }

  if (!left)  return { identical: 0, different: 0, commentsOnly: 0, leftOnly: 0, rightOnly: rightLines, total }
  if (!right) return { identical: 0, different: 0, commentsOnly: 0, leftOnly: leftLines, rightOnly: 0, total }

  if (leftLines > MAX_LINES || rightLines > MAX_LINES) {
    // Archivos muy grandes: solo mostrar totales sin clasificar
    return { identical: 0, different: 0, commentsOnly: 0, leftOnly: 0, rightOnly: 0, total }
  }

  const dmp = new DiffMatchPatch()
  const { chars1, chars2, lineArray } = dmp.diff_linesToChars_(left, right)
  const diffs = dmp.diff_main(chars1, chars2, false)
  dmp.diff_charsToLines_(diffs, lineArray)

  let identical = 0, different = 0, leftOnly = 0, rightOnly = 0

  let i = 0
  while (i < diffs.length) {
    const [op, text] = diffs[i]

    if (op === 0) {
      identical += countLines(text)
      i++
    } else if (op === -1) {
      // DELETE: ver si va seguido de INSERT (= líneas modificadas)
      const delCount = countLines(text)
      if (i + 1 < diffs.length && diffs[i + 1][0] === 1) {
        const insCount = countLines(diffs[i + 1][1])
        const modified = Math.min(delCount, insCount)
        different += modified
        leftOnly  += delCount - modified
        rightOnly += insCount - modified
        i += 2
      } else {
        leftOnly += delCount
        i++
      }
    } else {
      // INSERT sin DELETE previo
      rightOnly += countLines(text)
      i++
    }
  }

  return { identical, different, commentsOnly: 0, leftOnly, rightOnly, total }
}
