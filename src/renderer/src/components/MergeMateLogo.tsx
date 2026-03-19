import React from 'react'

/**
 * Logo vectorial de MergeMate.
 * Concepto: dos archivos con líneas de diff (rojo=eliminado, verde=añadido)
 * conectados por flechas bidireccionales en azul VS Code.
 */
export function MergeMateLogo({ size = 140 }: { size?: number }): React.JSX.Element {
  const h = Math.round(size * 0.625) // ratio 160:100
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Archivo izquierdo ─────────────────────────────── */}
      <rect x="2" y="12" width="54" height="68" rx="5" fill="#252526" stroke="#3e3e42" strokeWidth="1.5" />
      {/* Esquina doblada (dog-ear) */}
      <path d="M 46 12 L 56 22 L 46 22 Z" fill="#1a1a1a" />
      <line x1="46" y1="12" x2="46" y2="22" stroke="#3e3e42" strokeWidth="1.5" />
      <line x1="46" y1="22" x2="56" y2="22" stroke="#3e3e42" strokeWidth="1.5" />

      {/* Líneas de código — izquierdo (rojo = eliminadas) */}
      <rect x="12" y="32" width="28" height="3.5" rx="1.75" fill="#ef4444" opacity="0.9" />
      <rect x="12" y="43" width="20" height="3.5" rx="1.75" fill="#555555" opacity="0.7" />
      <rect x="12" y="54" width="24" height="3.5" rx="1.75" fill="#ef4444" opacity="0.9" />
      <rect x="12" y="65" width="16" height="3.5" rx="1.75" fill="#555555" opacity="0.7" />

      {/* ── Archivo derecho ────────────────────────────────── */}
      <rect x="104" y="12" width="54" height="68" rx="5" fill="#252526" stroke="#3e3e42" strokeWidth="1.5" />
      {/* Esquina doblada */}
      <path d="M 148 12 L 158 22 L 148 22 Z" fill="#1a1a1a" />
      <line x1="148" y1="12" x2="148" y2="22" stroke="#3e3e42" strokeWidth="1.5" />
      <line x1="148" y1="22" x2="158" y2="22" stroke="#3e3e42" strokeWidth="1.5" />

      {/* Líneas de código — derecho (verde = añadidas) */}
      <rect x="114" y="32" width="28" height="3.5" rx="1.75" fill="#22c55e" opacity="0.9" />
      <rect x="114" y="43" width="20" height="3.5" rx="1.75" fill="#555555" opacity="0.7" />
      <rect x="114" y="54" width="24" height="3.5" rx="1.75" fill="#22c55e" opacity="0.9" />
      <rect x="114" y="65" width="16" height="3.5" rx="1.75" fill="#555555" opacity="0.7" />

      {/* ── Flechas centrales (azul VS Code) ─────────────── */}
      {/* Flecha → (izquierda a derecha) */}
      <line x1="61" y1="43" x2="91" y2="43" stroke="#007acc" strokeWidth="3" strokeLinecap="round" />
      <path d="M 86 38 L 97 43 L 86 48 Z" fill="#007acc" />

      {/* Flecha ← (derecha a izquierda) */}
      <line x1="99" y1="57" x2="69" y2="57" stroke="#007acc" strokeWidth="3" strokeLinecap="round" />
      <path d="M 74 52 L 63 57 L 74 62 Z" fill="#007acc" />
    </svg>
  )
}
