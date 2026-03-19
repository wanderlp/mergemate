# MergeMate — Funcionalidades

## Sistema de tabs estilo VS Code
- Cada archivo abierto aparece en su propio tab con el icono del tipo de archivo
- Cierre con clic en la X, con el botón central del ratón o con `Escape` para volver a la vista de comparación
- El tab de **Comparación** siempre está disponible mientras haya carpetas abiertas

---

## Vista de comparación de carpetas
- Abre dos carpetas y visualiza todos los archivos en un árbol unificado
- Estado de cada archivo codificado por color:
  - 🟢 **Verde** — idénticos byte a byte (mismo hash SHA256)
  - 🔴 **Rojo** — diferencias de código significativas
  - 🟡 **Amarillo** — difieren solo en comentarios o espacios en blanco
  - 🔵 **Azul** — existe solo en la carpeta izquierda
  - 🟣 **Morado** — existe solo en la carpeta derecha
- Icono de tipo de archivo por extensión (TypeScript, C#, Python, PHP, C++, etc.) con logo oficial de devicon
- Carpetas colapsables, ordenadas: directorios primero, luego archivos, ambos alfabéticamente
- Barra de estado con conteo por categoría

### Navegación por teclado en el árbol
| Tecla | Acción |
|-------|--------|
| `↑` / `↓` | Moverse entre filas |
| `→` | Expandir carpeta (o ir al primer hijo si ya está expandida) |
| `←` | Colapsar carpeta (o subir al directorio padre) |
| `Enter` | Abrir archivo / expandir-colapsar carpeta |

### Directorios ignorados
`node_modules`, `.git`, `__pycache__`, `dist`, `build`, `.next`, `out`, `target`, `.gradle`, `.idea`, `.vscode`, `*.bak`

---

## Visor de diferencias (archivos de texto)
- Monaco Editor en modo lado a lado (tema vs-dark)
- Detección automática de lenguaje por extensión de archivo
- Navegación entre bloques de diferencia con botones Anterior/Siguiente
- Copiar izquierda→derecha o derecha→izquierda (crea copia de seguridad .bak automáticamente)
- Guardar cualquiera de los dos lados de forma independiente

---

## Visor de imágenes
Doble clic en cualquier imagen abre un visor dedicado con cuatro modos:
- **Lado a lado** — ambas versiones en paneles paralelos (modo por defecto)
- **Slider** — arrastra para revelar izquierda/derecha sobre la misma imagen (ideal para detectar cambios visuales sutiles)
- **Solo izquierda / Solo derecha** — vista individual
- Zoom con botones + / − (25 % – 400 %), rueda del ratón (pasos de 15 %) y botón de reinicio
- Navegación con drag cuando el zoom es mayor a 100 % (cursor de mano)
- Si ambas imágenes son idénticas se muestran como una sola sin controles de modo
- La barra de estado muestra dimensiones en píxeles y tamaño de archivo de cada versión

Formatos soportados: `png`, `jpg`, `jpeg`, `gif`, `bmp`, `ico`, `tiff`, `tif`, `webp`, `avif`, `svg`

---

## Atajos de teclado globales

| Atajo | Acción |
|-------|--------|
| `Ctrl/Cmd + L` | Abrir carpeta izquierda |
| `Ctrl/Cmd + R` | Abrir carpeta derecha |
| `Ctrl/Cmd + F5` | Actualizar escaneo |
| `Escape` | Volver a la vista de carpetas |
| `Ctrl/Cmd + S` | Guardar archivo derecho en el visor de diferencias |
| `Alt + ↑` | Bloque de diferencia anterior |
| `Alt + ↓` | Siguiente bloque de diferencia |
