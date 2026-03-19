/**
 * Genera los iconos de la app a partir de resources/icon.svg.
 * Salida:
 *   resources/icon.png   — 512×512 PNG (Linux / electron-builder)
 *   resources/icon.ico   — multi-resolución ICO (Windows)
 *   resources/icon.icns  — ICNS (macOS)
 *
 * Uso: node scripts/generate-icons.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Renderizar SVG → PNG con @resvg/resvg-js
const { Resvg } = await import('@resvg/resvg-js')
const svgPath = resolve(root, 'resources', 'icon.svg')
const svg = readFileSync(svgPath)
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } })
const pngBuffer = resvg.render().asPng()

const pngPath = resolve(root, 'resources', 'icon.png')
writeFileSync(pngPath, pngBuffer)
console.log('✔ icon.png generado')

// PNG → ICO (Windows) con png2icons
const png2icons = (await import('png2icons')).default
const icoBuffer = png2icons.createICO(pngBuffer, png2icons.BILINEAR, 0, true)
if (!icoBuffer) throw new Error('Error generando ICO')
writeFileSync(resolve(root, 'resources', 'icon.ico'), icoBuffer)
console.log('✔ icon.ico generado')

// PNG → ICNS (macOS) con png2icons
const icnsBuffer = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, 0)
if (!icnsBuffer) throw new Error('Error generando ICNS')
writeFileSync(resolve(root, 'resources', 'icon.icns'), icnsBuffer)
console.log('✔ icon.icns generado')

console.log('\nIconos generados en resources/')
