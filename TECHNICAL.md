# MergeMate — Documentación técnica

Requisitos, comandos de build y arquitectura del proyecto. Para las
funcionalidades del producto ver [README.md](README.md) y
[FEATURES.md](FEATURES.md).

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Cómo ejecutar en desarrollo

```bash
npm install
npm run dev
```

---

## Comandos

| Comando              | Resultado                              |
| -------------------- | --------------------------------------- |
| `npm run dev`         | App en modo desarrollo (hot-reload)     |
| `npm run build`        | Compila los tres procesos (main, preload, renderer) |
| `npm run typecheck`     | Verifica TypeScript sin emitir archivos |
| `npm run lint`          | ESLint sobre todo el código              |
| `npm run test:e2e`      | Build + suite de Playwright (Electron)   |
| `npm run dist:win`   | `dist/MergeMate-Setup.exe`               |
| `npm run dist:mac`   | `dist/MergeMate.dmg`                     |
| `npm run dist:linux` | `dist/MergeMate.AppImage`                |
| `npm run dist`       | Todas las plataformas                    |

No hay pruebas unitarias — el modo estricto de TypeScript más la suite e2e de
Playwright son la garantía principal de corrección.

---

## Stack

- **Electron** — shell de escritorio
- **React 18 + TypeScript** — interfaz de usuario (modo estricto)
- **Vite + electron-vite** — herramientas de compilación
- **Monaco Editor** — visor de diferencias
- **Tailwind CSS + shadcn/ui** — estilos con tema oscuro/claro y componentes accesibles basados en Radix UI
- **electron-store** — persistencia del historial de comparaciones recientes y estado de ventana
- **electron-updater** — actualizaciones automáticas desde GitHub Releases
- **react-compare-slider** — visor comparativo de imágenes con slider
- **@iconify/react + @iconify/icons-devicon** — iconos de tipo de archivo por extensión
- **i18next + react-i18next** — internacionalización (ES / EN / DE / FR / PT), detección automática del idioma del OS
- **Playwright** — suite e2e sobre la app Electron empaquetada

---

## Arquitectura

Proyecto estándar de electron-vite con tres targets de compilación independientes:

**Proceso principal** (`src/main/`) — Node.js, corre en Electron. Gestiona
todo el acceso al sistema de archivos y los manejadores IPC. El pipeline de
escaneo es: `scanner.ts` recolecta todas las rutas de ambas carpetas →
`classifier.ts` hashea los archivos (SHA256) y clasifica cada uno como
idéntico/diferente/solo-comentarios/solo-izquierda/solo-derecha →
`commentStripper.ts` normaliza el código fuente para la comparación de
solo-comentarios. Todo el trabajo pesado ocurre aquí para mantener la UI
fluida.

**Preload** (`src/preload/index.ts`) — puente delgado. Expone
`window.electronAPI` mediante `contextBridge`. Toda llamada IPC desde el
renderer pasa por aquí, bajo sandbox (`sandbox: true`) y con validación de
paths contra las carpetas autorizadas de la sesión actual.

**Renderer** (`src/renderer/src/`) — React 18 + Tailwind. El routing entre
pantallas se hace por hash de URL (`#startup` / `#main` / `#settings`). La
pantalla de inicio muestra acciones y comparaciones recientes. La pantalla
principal controla la vista de comparación de carpetas (árbol de archivos) y
la vista de diferencias (Monaco). El renderer nunca importa APIs de Node.js
directamente.

**Tipos compartidos** (`src/types.ts`) — importado tanto por main como por el
renderer.

---

## CI

`.github/workflows/ci.yml` corre lint, typecheck y la suite e2e completa
(matrix Windows/macOS/Linux) en cada push a tags `v*` y en cada PR a `main`.
`.github/workflows/release.yml` sube los binarios compilados como artifact del
run.
