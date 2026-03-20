# MergeMate

<p align="center">
  <img src="resources/icon.svg" width="120" alt="MergeMate logo"/>
</p>

**MergeMate — Compara y fusiona carpetas**

---

Herramienta de escritorio para comparar y fusionar carpetas de código fuente. Visualiza diferencias entre dos directorios en un árbol unificado con estado por color, abre archivos en tabs estilo VS Code con iconos por tipo de archivo, incluye un visor de diferencias línea por línea con Monaco Editor con capacidades de fusión, y un comparador de imágenes con zoom, slider y navegación.

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
- **i18next + react-i18next** — internacionalización (ES / EN / DE / FR / PT), detección automática del idioma del OS

## Sobre este proyecto

MergeMate es un experimento en desarrollo acelerado de software: una herramienta completamente funcional construida en colaboración con **Claude** (Anthropic) para demostrar lo que es posible cuando la IA acompaña cada paso del proceso — desde la arquitectura hasta los detalles de UX. Cada funcionalidad, decisión de diseño y línea de código ha sido co-creada en esa dinámica, no generada automáticamente.

El proyecto nace en **Guatemala** 🇬🇹 y está abierto a colaboraciones de todo el mundo. El idioma principal del proyecto (código, issues, PRs y discusiones) es el **español**.

> 🚧 **En desarrollo activo** — el proyecto crece con nuevas funcionalidades y mejoras de forma continua. Si tienes ideas o quieres contribuir, eres bienvenido.
