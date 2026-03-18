# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Comandos

```bash
npm run dev          # Iniciar la app en modo desarrollo (hot-reload)
npm run build        # Compilar los tres procesos (main, preload, renderer)
npm run typecheck    # Verificar TypeScript sin emitir archivos
npm run dist:win     # Generar instalador de Windows (MergeMate-Setup.exe)
npm run dist:mac     # Generar DMG de macOS
npm run dist:linux   # Generar AppImage de Linux
```

No hay pruebas automatizadas. El modo estricto de TypeScript es la principal garantía de corrección — siempre ejecutar `npm run typecheck` después de hacer cambios.

## Arquitectura

La app es un proyecto estándar de electron-vite con tres targets de compilación independientes:

**Proceso principal** (`src/main/`) — Node.js, corre en Electron. Gestiona todo el acceso al sistema de archivos y los manejadores IPC. El pipeline de escaneo es: `scanner.ts` recolecta todas las rutas de ambas carpetas → `classifier.ts` hashea los archivos (SHA256 vía `crypto` de Node) y clasifica cada uno como idéntico/diferente/solo-comentarios/solo-izquierda/solo-derecha → `commentStripper.ts` normaliza el código fuente para la comparación de solo-comentarios. Todo el trabajo pesado ocurre aquí para mantener la UI fluida.

**Preload** (`src/preload/index.ts`) — puente delgado. Expone `window.electronAPI` mediante `contextBridge`. Toda llamada IPC desde el renderer pasa por aquí. La forma está definida en `src/types.ts`.

**Renderer** (`src/renderer/src/`) — React 18 + Tailwind, tema oscuro estilo VS Code. Dos pantallas controladas en `App.tsx`: la vista de comparación de carpetas (FileTree) y la vista de diferencias (DiffViewer). El estado vive en dos hooks: `useFolderScan` (ciclo de vida del escaneo, progreso, persistencia de carpetas vía electron-store) y `useFileDiff` (carga de archivos, guardar, copiar con backup). El renderer nunca importa APIs de Node.js directamente.

**Tipos compartidos** (`src/types.ts`) — importado tanto por main como por el renderer. `tsconfig.node.json` y `tsconfig.web.json` incluyen este archivo explícitamente.

## Restricciones importantes

- `"type": "module"` NO debe estar en `package.json` — electron-vite genera CJS para main/preload, y agregarlo rompe Electron en tiempo de ejecución (causa ventana en negro).
- electron-store se usa para persistir `lastLeftFolder` / `lastRightFolder`. El tipo del esquema es `StoreSchema` en `src/main/index.ts`.
- El renderer se comunica exclusivamente mediante `window.electronAPI` (contextBridge). Agregar nuevas llamadas IPC requiere cambios en tres lugares: `src/main/index.ts` (manejador), `src/preload/index.ts` (puente), `src/types.ts` (interfaz ElectronAPI).
- Los directorios ignorados durante el escaneo están hardcodeados en `scanner.ts`: `node_modules`, `.git`, `__pycache__`, `dist`, `build`, `.next`, `out`, `target`, `.gradle`, `.idea`, `.vscode`, y archivos `*.bak`.
