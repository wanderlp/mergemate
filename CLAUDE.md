# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Comandos

```bash
npm run dev          # Iniciar la app en modo desarrollo (hot-reload)
npm run build        # Compilar los tres procesos (main, preload, renderer)
npm run typecheck    # Verificar TypeScript sin emitir archivos
npm run gen-icons    # Regenerar iconos de la app desde resources/icon.svg
npm run dist:win     # Generar instalador de Windows (MergeMate-Setup.exe)
npm run dist:mac     # Generar DMG de macOS
npm run dist:linux   # Generar AppImage de Linux
```

No hay pruebas automatizadas. El modo estricto de TypeScript es la principal garantía de corrección — siempre ejecutar `npm run typecheck` después de hacer cambios.

## Arquitectura

La app es un proyecto estándar de electron-vite con tres targets de compilación independientes:

**Proceso principal** (`src/main/`) — Node.js, corre en Electron. Gestiona todo el acceso al sistema de archivos y los manejadores IPC. El pipeline de escaneo es: `scanner.ts` recolecta todas las rutas de ambas carpetas → `classifier.ts` hashea los archivos (SHA256 vía `crypto` de Node) y clasifica cada uno como idéntico/diferente/solo-comentarios/solo-izquierda/solo-derecha → `commentStripper.ts` normaliza el código fuente para la comparación de solo-comentarios. Todo el trabajo pesado ocurre aquí para mantener la UI fluida.

**Preload** (`src/preload/index.ts`) — puente delgado. Expone `window.electronAPI` mediante `contextBridge`. Toda llamada IPC desde el renderer pasa por aquí. La forma está definida en `src/types.ts`.

**Renderer** (`src/renderer/src/`) — React 18 + Tailwind, tema oscuro estilo VS Code. El routing entre pantallas se hace por hash de URL (`#startup` / `#main`) en `main.tsx`. La pantalla de inicio (`StartupScreen`) muestra acciones y comparaciones recientes. La pantalla principal (`App.tsx`) controla: la vista de comparación de carpetas (FileTree) y la vista de diferencias (DiffViewer). El estado vive en el hook `useFolderScan` (ciclo de vida del escaneo, progreso, auto-scan desde recientes). El renderer nunca importa APIs de Node.js directamente.

**Tipos compartidos** (`src/types.ts`) — importado tanto por main como por el renderer. `tsconfig.node.json` y `tsconfig.web.json` incluyen este archivo explícitamente.

## Flujo de trabajo con Git

- **Nunca** hacer commit, push ni crear PRs de forma automática o por iniciativa propia.
- Esperar siempre a que el programador indique explícitamente cuándo hacer cada acción por separado: primero el commit, luego el push, luego el PR si aplica.
- El programador necesita tiempo para probar los cambios antes de confirmarlos.

### Mensajes de commit

Seguir la convención **Conventional Commits**: el prefijo va en inglés (`fix:`, `feat:`, `chore:`, `ci:`, `docs:`, etc.), pero la descripción que sigue al prefijo debe estar en **español**.

- Correcto: `fix: corregir valor inicial del selector de idioma`
- Incorrecto: `fix: fix language selector initial value`

## Idioma

Toda la comunicación con Claude, comentarios en el código y respuestas deben ser en **español**. Esto incluye explicaciones, sugerencias, mensajes de error y cualquier interacción durante el desarrollo.

## Accesibilidad

Todo código nuevo en el renderer debe cumplir con estas reglas antes de darse por terminado:

- **Roles ARIA**: elementos interactivos que no sean `<button>` o `<a>` deben tener `role` apropiado (`tab`, `tablist`, `status`, `img`, `alert`, etc.)
- **Teclado**: cualquier elemento clickeable debe ser operable con `Enter`/`Space`. Listas de items navegables deben soportar teclas de flecha.
- **`aria-label`**: botones con solo icono y áreas interactivas sin texto visible deben tener `aria-label` descriptivo.
- **`aria-hidden`**: emojis decorativos, iconos y elementos puramente visuales deben tener `aria-hidden="true"`.
- **`aria-live`**: estados dinámicos (carga, errores, notificaciones) deben usar `role="status"` o `aria-live="polite"`.
- **Contraste**: no usar colores de texto con ratio menor a 4.5:1 sobre el fondo. Evitar `#555` o más oscuro sobre fondos `#1e1e1e`.
- **`prefers-reduced-motion`**: cualquier animación con Framer Motion debe usar `useReducedMotion()` y desactivarse si el usuario lo prefiere.
- **Paneles ocultos**: usar `aria-hidden="true"` en contenido ocultado con `display:none` que contenga elementos interactivos.

## Consistencia visual

Todo código nuevo en el renderer debe respetar el sistema visual existente:

- **Fondos**: `#1e1e1e` (principal), `#252526` (toolbars/headers), `#2d2d2d` (tabbar), `#181818` (áreas de contenido oscuro)
- **Bordes**: `#3e3e42`
- **Botones**: `bg-[#3e3e42]` con `hover:bg-[#505050]`, padding `px-3 py-1.5` para botones con texto, `p-1.5` para botones solo con icono
- **Texto**: `#cccccc` (primario), `#aaaaaa` (secundario), `#858585` (atenuado)
- **Disabled**: siempre `disabled:opacity-40`
- **Separadores**: `mx-2 h-4 w-px bg-[#3e3e42]`
- **Colores de acento**: usar hex directamente (`#007acc` para azul VS Code) — no usar clases de color de Tailwind como `bg-blue-500`
- **Transiciones**: `transition-colors` en botones e interacciones

Antes de agregar cualquier componente nuevo, verificar que siga estas convenciones.

## Animaciones

El proyecto usa **Framer Motion** para animaciones UI. Al revisar o modificar componentes del renderer, si se identifica un lugar donde una animación mejoraría la experiencia (entrada/salida de elementos, transiciones de estado, feedback visual), **sugerir proactivamente la animación al programador** antes de implementarla, explicando:
1. Qué elemento se animaría y en qué momento
2. Cómo funcionaría (tipo de animación, duración aproximada)
3. Cómo se implementaría con Framer Motion (`motion.div`, `AnimatePresence`, `variants`, etc.)

No implementar la animación sin que el programador confirme primero.

## shadcn/ui

El proyecto usa **shadcn/ui** como sistema de componentes base. Todo código nuevo en el renderer debe respetar esta integración:

- **Botones**: usar `<Button>` de `components/ui/button.tsx` en lugar de elementos `<button>` nativos. Variantes disponibles: `default` (fondo `#3e3e42`), `primary` (azul `#007acc`), `ghost` (transparente). Tamaños: `default` (`px-3 py-1.5`), `sm` (`px-2 py-1`), `icon` (`p-1.5` para botones solo con icono).
- **Separadores**: usar `<Separator orientation="vertical" className="mx-1" />` de `components/ui/separator.tsx` en lugar del div `h-4 w-px bg-[#3e3e42]`.
- **Barras de progreso**: usar `<Progress value={n} />` de `components/ui/progress.tsx`.
- **Tooltips**: `<TooltipProvider>` ya está en `App.tsx`. Usar `<Tooltip>`, `<TooltipTrigger>`, `<TooltipContent>` de `components/ui/tooltip.tsx` cuando se quiera un tooltip accesible y animado.
- **Utilidad `cn()`**: usar `cn()` de `lib/utils.ts` para combinar clases Tailwind de forma segura (evita conflictos con `twMerge`).
- **CSS variables**: el tema está mapeado en `index.css` con variables HSL (`--background`, `--primary`, `--border`, etc.). Nuevos componentes shadcn deben seguir el mismo patrón.
- **No crear botones nativos** cuando ya existe el componente `Button` — mantener consistencia y aprovechar el manejo centralizado de `disabled:opacity-40` y `focus-visible`.

## Internacionalización (i18n)

El proyecto usa **i18next + react-i18next** para soportar múltiples idiomas. Idiomas disponibles: **Español (ES)**, **Inglés (EN)**, **Alemán (DE)**, **Francés (FR)** y **Portugués (PT)**. El idioma se detecta automáticamente del OS y se persiste en `localStorage` con la clave `mergemate-language`.

Reglas al agregar texto nuevo en el renderer:

- **Nunca hardcodear strings visibles** — todo texto visible por el usuario debe ir en los archivos de traducción.
- **Archivos de traducción**: `src/renderer/src/locales/{es,en,de,fr,pt}.json`. Agregar la clave en **todos** los archivos siempre.
- **Usar el hook**: `const { t } = useTranslation()` en el componente y referenciar con `t('seccion.clave')`.
- **Interpolación**: usar `t('clave', { variable: valor })` y en el JSON `"{{variable}}"`.
- **Plurales**: usar sufijos `_one` / `_other` en el JSON y pasar `{ count: n }` al llamar a `t()`.
- **Estructura de claves**: organizadas por componente (`titleBar`, `toolbar`, `startup`, `diff`, `status`, `image`, `tabBar`, `progress`, `welcome`, `closeDialog`, `copy`).
- **Inicialización**: `src/renderer/src/i18n.ts` configura i18next con recursos inline (sin carga asíncrona). Se importa en `main.tsx` antes de renderizar.
- El selector de idioma está en `TitleBar` y cambia el idioma instantáneamente en toda la UI.

## Documentación del proyecto

- **README.md** — La sección `## Funcionalidades` debe mantenerse siempre entre **5 y 7 ítems**. Es un resumen para visitantes del repositorio; el detalle completo vive en `FEATURES.md`. Al agregar funcionalidades, consolidar o fusionar ítems existentes si se llega a 8 o más.
- **FEATURES.md** — Documento exhaustivo. Cada funcionalidad relevante debe tener su propia sección con viñetas detalladas.
- Al implementar una funcionalidad nueva, verificar si README.md y FEATURES.md requieren actualización.

## Restricciones importantes

- `"type": "module"` NO debe estar en `package.json` — electron-vite genera CJS para main/preload, y agregarlo rompe Electron en tiempo de ejecución (causa ventana en negro).
- electron-store se usa para persistir `recentComparisons` (array de hasta 8 pares `{ left, right, lastUsed }`) y `windowState`. El tipo del esquema es `StoreSchema` en `src/main/index.ts`.
- El renderer se comunica exclusivamente mediante `window.electronAPI` (contextBridge). Agregar nuevas llamadas IPC requiere cambios en tres lugares: `src/main/index.ts` (manejador), `src/preload/index.ts` (puente), `src/types.ts` (interfaz ElectronAPI).
- Los directorios ignorados durante el escaneo están hardcodeados en `scanner.ts`: `node_modules`, `.git`, `__pycache__`, `dist`, `build`, `.next`, `out`, `target`, `.gradle`, `.idea`, `.vscode`, y archivos `*.bak`.
