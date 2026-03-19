# MergeMate

**MergeMate — Comparador de Carpetas**

Aplicación de escritorio para comparar carpetas de código fuente lado a lado. Clasifica cada archivo visualmente por color y permite hacer doble clic en cualquier archivo para abrir un visor de diferencias línea por línea con capacidades de fusión.

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

### Vista de comparación de carpetas
- Abre dos carpetas y visualiza todos los archivos en un árbol unificado
- Estado de cada archivo codificado por color:
  - 🟢 **Verde** — idénticos byte a byte (mismo hash SHA256)
  - 🔴 **Rojo** — diferencias de código significativas
  - 🟡 **Amarillo** — difieren solo en comentarios o espacios en blanco
  - 🔵 **Azul** — existe solo en la carpeta izquierda
  - 🟣 **Morado** — existe solo en la carpeta derecha
- Carpetas colapsables, ordenadas: directorios primero, luego archivos, ambos alfabéticamente
- Barra de estado con conteo por categoría

### Visor de diferencias (archivos de texto)
- Monaco Editor en modo lado a lado (tema vs-dark)
- Detección automática de lenguaje por extensión de archivo
- Navegación entre bloques de diferencia con botones Anterior/Siguiente
- Copiar izquierda→derecha o derecha→izquierda (crea copia de seguridad .bak automáticamente)
- Guardar cualquiera de los dos lados de forma independiente

### Visor de imágenes
Doble clic en cualquier imagen abre un visor dedicado con cuatro modos:
- **Slider** — arrastra para revelar izquierda/derecha sobre la misma imagen (ideal para detectar cambios visuales sutiles)
- **Lado a lado** — ambas versiones en paralelo
- **Solo izquierda / Solo derecha** — vista individual
- Zoom con botones + / − (25 % – 400 %) y botón de reinicio

Formatos soportados: `png`, `jpg`, `jpeg`, `gif`, `bmp`, `ico`, `tiff`, `tif`, `webp`, `avif`, `svg`

### Árbol de archivos — navegación por teclado
| Tecla | Acción |
|-------|--------|
| `↑` / `↓` | Moverse entre filas |
| `→` | Expandir carpeta (o ir al primer hijo si ya está expandida) |
| `←` | Colapsar carpeta (o subir al directorio padre) |
| `Enter` | Abrir archivo / expandir-colapsar carpeta |

### Directorios ignorados
`node_modules`, `.git`, `__pycache__`, `dist`, `build`, `.next`, `out`, `target`, `.gradle`, `.idea`, `.vscode`, `*.bak`

---

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl/Cmd + L` | Abrir carpeta izquierda |
| `Ctrl/Cmd + R` | Abrir carpeta derecha |
| `Ctrl/Cmd + F5` | Actualizar escaneo |
| `Escape` | Volver a la vista de carpetas |
| `Ctrl/Cmd + S` | Guardar archivo derecho en el visor de diferencias |
| `Alt + ↑` | Bloque de diferencia anterior |
| `Alt + ↓` | Siguiente bloque de diferencia |

---

## Tecnologías

- **Electron** — shell de escritorio
- **React 18 + TypeScript** — interfaz de usuario (modo estricto)
- **Vite + electron-vite** — herramientas de compilación
- **Monaco Editor** — visor de diferencias
- **Tailwind CSS** — estilos con tema oscuro
- **electron-store** — persistencia de las últimas carpetas usadas
- **react-compare-slider** — visor comparativo de imágenes con slider
- **Lucide React** — íconos
