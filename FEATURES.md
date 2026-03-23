# MergeMate — Funcionalidades

## Pantalla de inicio

- Diseño estilo Visual Studio con panel izquierdo de acciones y panel derecho de recientes
- Tres modos disponibles (en orden): **Comparación en blanco**, **Comparar 2 archivos**, **Comparar 2 carpetas**
- Lista de hasta 8 comparaciones recientes con rutas y tiempo relativo ("hace 5 min", "ayer", etc.)
- El modo de cada reciente se guarda; al reabrir se detecta automáticamente si son archivos o carpetas por el sistema de archivos
- Icono diferenciado en recientes: carpeta para comparaciones de directorio, documento para comparaciones de archivo
- Clic en una comparación reciente abre el comparador en el modo correcto automáticamente
- Ventana independiente (900 × 600, no redimensionable) separada de la ventana de comparación

---

## Barra de título personalizada

- Reemplaza la barra nativa de Windows con una barra frameless integrada al tema oscuro
- Muestra el icono de la app y el nombre **MergeMate**
- Botones de control de ventana: minimizar, maximizar/restaurar y cerrar (con hover rojo en cerrar)
- Selector de idioma integrado: cambia entre los 5 idiomas disponibles instantáneamente
- Área de arrastre para mover la ventana (`-webkit-app-region: drag`)

---

## Sistema de tabs estilo VS Code

- Cada archivo abierto aparece en su propio tab con el icono del tipo de archivo
- Cierre con clic en la X, con el botón central del ratón o con `Escape` para volver a la vista de comparación
- Tabs no cerrables: **Comparación** (carpetas), **Editor libre** y **Comparar archivos** (persisten mientras la sesión esté abierta)
- El tab **Editor libre** muestra un icono de portapapeles; el de comparación de carpetas muestra un icono de carpeta
- Los tabs aparecen y desaparecen con animación suave

---

## Vista de comparación de carpetas

- Abre dos carpetas y visualiza todos los archivos en un árbol unificado
- Estado de cada archivo codificado por color:
  - 🟢 **Verde** — idénticos byte a byte (mismo hash SHA256)
  - 🔴 **Rojo** — diferencias de código significativas
  - 🟡 **Amarillo** — difieren solo en comentarios o espacios en blanco
  - 🔵 **Azul** — existe solo en la carpeta izquierda
  - 🟣 **Morado** — existe solo en la carpeta derecha
- Icono de tipo de archivo por extensión con logos oficiales: devicon para lenguajes de código (TypeScript, C#, Python, PHP, C++, etc.) y MDI para formatos de imagen (PNG, JPG, GIF, etc.)
- Carpetas colapsables, ordenadas: directorios primero, luego archivos, ambos alfabéticamente
- Animación de llenado progresivo al cargar el resultado del escaneo
- Expansión y colapso de carpetas con animación suave
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

## Comparación de archivos individuales

- Selección de dos archivos desde el disco vía diálogos nativos del sistema operativo
- Si el primer archivo es una imagen, el segundo diálogo filtra automáticamente solo imágenes
- Si el primer archivo no es imagen, se valida que el segundo tampoco lo sea (con mensaje de error en la UI)
- Dos imágenes seleccionadas abren directamente el visor de imágenes con slider
- La comparación se guarda en recientes con su modo (`files`) para reabrirse correctamente

---

## Editor libre

- Monaco Editor en blanco sin archivos vinculados
- El usuario puede pegar código en cualquiera de los dos paneles y comparar en tiempo real
- Accesible desde la pantalla de inicio como primera opción

---

## Visor de imágenes

Disponible al abrir una imagen desde el árbol de carpetas o al comparar dos archivos de imagen directamente. Cuatro modos:

- **Lado a lado** — ambas versiones en paneles paralelos (modo por defecto)
- **Slider** — arrastra para revelar izquierda/derecha sobre la misma imagen (ideal para detectar cambios visuales sutiles)
- **Solo izquierda / Solo derecha** — vista individual
- Zoom con botones + / − (25 % – 400 %), rueda del ratón (pasos de 15 %) y botón de reinicio
- Navegación con drag cuando el zoom es mayor a 100 % (cursor de mano)
- Si ambas imágenes son idénticas se muestran como una sola sin controles de modo
- La barra de estado muestra dimensiones en píxeles y tamaño de archivo de cada versión

Formatos soportados: `png`, `jpg`, `jpeg`, `gif`, `bmp`, `ico`, `tiff`, `tif`, `webp`, `avif`, `svg`

---

## Actualizaciones automáticas

- Al iniciar la app (solo en producción), verifica silenciosamente si hay una nueva versión en GitHub Releases
- La descarga ocurre en segundo plano sin interrumpir el uso
- Al completarse, muestra un diálogo nativo preguntando si reiniciar para aplicar la actualización
- Si el usuario elige "Más tarde", la actualización se aplica automáticamente al cerrar la app
- Errores de red (sin internet, rate limit) se ignoran silenciosamente

---

## Diálogo de confirmación al cerrar

- Al intentar cerrar la ventana de comparación se muestra un diálogo de confirmación
- Advierte que los cambios no guardados se perderán
- Al confirmar, cierra el comparador y regresa automáticamente a la pantalla de inicio

---

## Soporte multiidioma

- 5 idiomas disponibles: **Español**, **Inglés**, **Alemán**, **Francés** y **Portugués**
- Detección automática del idioma del sistema operativo al iniciar
- Selector en la barra de título para cambiar de idioma instantáneamente sin reiniciar
- Preferencia persistida en `localStorage`

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
