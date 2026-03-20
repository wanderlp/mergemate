# MergeMate

<p align="center">
  <img src="resources/icon.svg" width="120" alt="MergeMate logo"/>
</p>

**MergeMate — Comparador de Carpetas**

Herramienta de escritorio para comparar carpetas de código fuente. Visualiza diferencias entre dos directorios en un árbol unificado con estado por color, abre archivos en tabs estilo VS Code con iconos por tipo de archivo, incluye un visor de diferencias línea por línea con Monaco Editor y un comparador de imágenes con zoom, slider y navegación.

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Cómo ejecutar

```bash
npm install
npm run dev
```

---

## Compilar para distribución

| Comando | Resultado |
|---------|-----------|
| `npm run dist:win` | `dist/MergeMate-Setup.exe` |
| `npm run dist:mac` | `dist/MergeMate.dmg` |
| `npm run dist:linux` | `dist/MergeMate.AppImage` |
| `npm run dist` | Todas las plataformas |

---

## Funcionalidades

- Tabs estilo VS Code con icono por tipo de archivo
- Árbol unificado con estado por color (idéntico, diferente, solo comentarios, solo izquierda, solo derecha)
- Visor de diferencias línea por línea con Monaco Editor y capacidades de fusión
- Visor de imágenes con modos lado a lado, slider, solo izquierda y solo derecha
- Navegación por teclado en el árbol de archivos

[Ver el detalle completo de funcionalidades →](FEATURES.md)

---

## Tecnologías

- **Electron** — shell de escritorio
- **React 18 + TypeScript** — interfaz de usuario (modo estricto)
- **Vite + electron-vite** — herramientas de compilación
- **Monaco Editor** — visor de diferencias
- **Tailwind CSS** — estilos con tema oscuro
- **shadcn/ui** — componentes de UI accesibles (Button, Separator, Progress, Tooltip) basados en Radix UI
- **electron-store** — persistencia del historial de comparaciones recientes y estado de ventana
- **react-compare-slider** — visor comparativo de imágenes con slider
- **@iconify/react + @iconify/icons-devicon** — iconos de tipo de archivo por extensión
- **Lucide React** — íconos de interfaz
