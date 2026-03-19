import React from 'react'
import { Icon } from '@iconify/react'
import imgPngIcon  from '@iconify/icons-mdi/file-png-box'
import imgJpgIcon  from '@iconify/icons-mdi/file-jpg-box'
import imgJpegIcon from '@iconify/icons-mdi/file-jpeg-box'
import imgGifIcon  from '@iconify/icons-mdi/file-gif-box'
import imgGenIcon  from '@iconify/icons-mdi/file-image'
import tsIcon       from '@iconify/icons-devicon/typescript'
import jsIcon       from '@iconify/icons-devicon/javascript'
import csIcon       from '@iconify/icons-devicon/csharp'
import cppIcon      from '@iconify/icons-devicon/cplusplus'
import cIcon        from '@iconify/icons-devicon/c'
import pyIcon       from '@iconify/icons-devicon/python'
import phpIcon      from '@iconify/icons-devicon/php'
import javaIcon     from '@iconify/icons-devicon/java'
import ktIcon       from '@iconify/icons-devicon/kotlin'
import goIcon       from '@iconify/icons-devicon/go'
import swiftIcon    from '@iconify/icons-devicon/swift'
import dartIcon     from '@iconify/icons-devicon/dart'
import rbIcon       from '@iconify/icons-devicon/ruby'
import htmlIcon     from '@iconify/icons-devicon/html5'
import cssIcon      from '@iconify/icons-devicon/css3'
import sassIcon     from '@iconify/icons-devicon/sass'
import vueIcon      from '@iconify/icons-devicon/vuejs'
import svelteIcon   from '@iconify/icons-devicon/svelte'
import reactIcon    from '@iconify/icons-devicon/react'
import mdIcon       from '@iconify/icons-devicon/markdown'
import yamlIcon     from '@iconify/icons-devicon/yaml'
import jsonIcon     from '@iconify/icons-devicon/json'
import bashIcon     from '@iconify/icons-devicon/bash'
import ps1Icon      from '@iconify/icons-devicon/powershell'
import luaIcon      from '@iconify/icons-devicon/lua'
import hsIcon       from '@iconify/icons-devicon/haskell'
import scalaIcon    from '@iconify/icons-devicon/scala'
import elixirIcon   from '@iconify/icons-devicon/elixir'
import fsIcon       from '@iconify/icons-devicon/fsharp'
import rIcon        from '@iconify/icons-devicon/r'
import xmlIcon      from '@iconify/icons-devicon/xml'
import texIcon      from '@iconify/icons-devicon/tex'
import groovyIcon   from '@iconify/icons-devicon/groovy'
import perlIcon     from '@iconify/icons-devicon/perl'
import matlabIcon   from '@iconify/icons-devicon/matlab'
import wasmIcon     from '@iconify/icons-devicon/wasm'
import dockerIcon   from '@iconify/icons-devicon/docker'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconData = any

const EXT_ICON_MAP: Record<string, IconData> = {
  ts: tsIcon, tsx: tsIcon, mts: tsIcon, cts: tsIcon,
  js: jsIcon, jsx: jsIcon, mjs: jsIcon, cjs: jsIcon,
  html: htmlIcon, htm: htmlIcon,
  css: cssIcon,
  scss: sassIcon, sass: sassIcon, less: cssIcon,
  vue: vueIcon,
  svelte: svelteIcon,
  react: reactIcon,
  cs: csIcon,
  cpp: cppIcon, cc: cppIcon, cxx: cppIcon, hpp: cppIcon, hxx: cppIcon,
  c: cIcon, h: cIcon,
  java: javaIcon,
  kt: ktIcon, kts: ktIcon,
  groovy: groovyIcon, gradle: groovyIcon,
  scala: scalaIcon,
  py: pyIcon,
  rb: rbIcon,
  php: phpIcon,
  pl: perlIcon, pm: perlIcon,
  lua: luaIcon,
  r: rIcon,
  matlab: matlabIcon, m: matlabIcon,
  go: goIcon,
  swift: swiftIcon,
  dart: dartIcon,
  hs: hsIcon, lhs: hsIcon,
  ex: elixirIcon, exs: elixirIcon,
  fs: fsIcon, fsx: fsIcon, fsi: fsIcon,
  json: jsonIcon, jsonc: jsonIcon,
  yaml: yamlIcon, yml: yamlIcon,
  xml: xmlIcon, xsl: xmlIcon, xsd: xmlIcon,
  md: mdIcon, mdx: mdIcon,
  tex: texIcon, latex: texIcon,
  sh: bashIcon, bash: bashIcon, zsh: bashIcon,
  ps1: ps1Icon, psm1: ps1Icon,
  wasm: wasmIcon,
  dockerfile: dockerIcon,
  // Imágenes — MDI
  png: imgPngIcon,
  jpg: imgJpgIcon,
  jpeg: imgJpegIcon,
  gif: imgGifIcon,
  webp: imgGenIcon, bmp: imgGenIcon, ico: imgGenIcon,
  tiff: imgGenIcon, tif: imgGenIcon, avif: imgGenIcon, svg: imgGenIcon,
}

const EXT_COLORS: Record<string, string> = {
  toml: '#9c4221', ini: '#6e6e6e', cfg: '#6e6e6e', conf: '#6e6e6e', env: '#6e6e6e',
  csv: '#237a2e', sql: '#e38c00', graphql: '#e10098', gql: '#e10098',
  rst: '#cccccc', txt: '#aaaaaa',
  bat: '#c1f12e', cmd: '#c1f12e',
  pdf: '#e53935',
  zip: '#b8860b', gz: '#b8860b', tar: '#b8860b', rar: '#b8860b',
  '7z': '#b8860b', bz2: '#b8860b', xz: '#b8860b',
  exe: '#6e6e6e', dll: '#6e6e6e', so: '#6e6e6e', bin: '#6e6e6e',
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export function FileTypeIcon({ extension, size = 18 }: { extension: string; size?: number }): React.JSX.Element {
  const ext = extension.toLowerCase()
  const icon = EXT_ICON_MAP[ext]

  if (icon) {
    return <Icon icon={icon} width={size} height={size} style={{ flexShrink: 0 }} />
  }

  const color = EXT_COLORS[ext] ?? '#858585'
  const rgb = hexToRgb(color)
  const label = ext.length > 4 ? ext.slice(0, 4) : ext

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, padding: '1px 4px', borderRadius: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
      lineHeight: '16px', flexShrink: 0, color,
      backgroundColor: `rgba(${rgb}, 0.15)`,
      border: `1px solid rgba(${rgb}, 0.45)`,
      fontFamily: 'monospace', textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}
