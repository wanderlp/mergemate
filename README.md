# MergeMate

**MergeMate — Folder Comparison Tool**

A production-quality desktop app for comparing source code folders side by side. Classifies each file visually by color, and lets you double-click any file to open a full line-by-line Monaco diff viewer with merge capabilities.

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Getting Started

```bash
npm install
npm run dev
```

---

## Build for Distribution

| Command | Output |
|---------|--------|
| `npm run dist:win` | `dist/MergeMate-Setup.exe` |
| `npm run dist:mac` | `dist/MergeMate.dmg` |
| `npm run dist:linux` | `dist/MergeMate.AppImage` |
| `npm run dist` | All platforms |

---

## Features

### Folder Comparison View
- Open two folders and see all files merged into a unified tree
- Color-coded file status:
  - 🟢 **Green** — byte-for-byte identical (same SHA256 hash)
  - 🔴 **Red** — meaningful code differences
  - 🟡 **Yellow** — differ only in comments/whitespace
  - 🔵 **Blue** — exists only in left folder
  - 🟣 **Purple** — exists only in right folder
- Folders are collapsible, sorted: directories first then files alphabetically
- Status bar shows counts per category

### Diff Viewer
- Monaco Editor side-by-side diff (vs-dark theme)
- Language auto-detection from file extension
- Navigate between diff hunks with Prev/Next buttons
- Copy left→right or right→left (creates .bak backup automatically)
- Save either side independently

### Ignored Directories
`node_modules`, `.git`, `__pycache__`, `dist`, `build`, `.next`, `out`, `target`, `.gradle`, `.idea`, `.vscode`, `*.bak`

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + L` | Open Left Folder |
| `Ctrl/Cmd + R` | Open Right Folder |
| `Ctrl/Cmd + F5` | Refresh scan |
| `Escape` | Back to folder view |
| `Ctrl/Cmd + S` | Save right file in diff view |
| `Alt + ↑` | Previous diff hunk |
| `Alt + ↓` | Next diff hunk |

---

## Tech Stack

- **Electron** — desktop shell
- **React 18 + TypeScript** — UI (strict mode)
- **Vite + electron-vite** — build tooling
- **Monaco Editor** — diff viewer
- **Tailwind CSS** — dark theme styling
- **electron-store** — persist last used folder paths
- **Lucide React** — icons
