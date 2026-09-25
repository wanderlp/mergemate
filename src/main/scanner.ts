import * as fs from "fs";
import * as path from "path";
import { classifyFiles } from "./classifier";
import type { FileEntry, ScanResult, ScanStats } from "../types";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "__pycache__",
  "dist",
  "build",
  ".next",
  "out",
  "target",
  ".gradle",
  ".idea",
  ".vscode",
  // Carpetas del sistema Windows
  "$RECYCLE.BIN",
  "System Volume Information",
  "Recovery",
  // Carpetas del sistema macOS
  ".Spotlight-V100",
  ".Trashes",
  ".fseventsd",
  // Carpetas del sistema Linux
  ".Trash-1000",
  ".cache"
]);

// Archivos de sistema exactos (nombre completo, insensible a mayúsculas)
const IGNORE_FILES_EXACT = new Set([
  // Windows
  "thumbs.db",
  "ehthumbs.db",
  "ehthumbs_vista.db",
  "desktop.ini",
  "ntuser.dat",
  "ntuser.ini",
  "pagefile.sys",
  "hiberfil.sys",
  "swapfile.sys",
  // macOS
  ".ds_store",
  ".localized",
  // Linux / KDE
  ".directory"
]);

// Extensiones o patrones de archivos de sistema
const IGNORE_EXTENSIONS = new Set([
  ".lnk", // accesos directos de Windows
  ".url" // accesos directos de internet de Windows
]);

const IGNORE_FILE_NAME = ".mergemate-ignore";

interface CompiledPattern {
  re: RegExp;
  dirOnly: boolean;
  baseOnly: boolean;
}

function compilePattern(raw: string): CompiledPattern | null {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return null;
  let p = line.replace(/^!/, "");
  const dirOnly = p.endsWith("/");
  if (dirOnly) p = p.slice(0, -1);
  const anchoredStart = p.startsWith("/");
  if (anchoredStart) p = p.slice(1);
  const anchoredEnd = !p.includes("*") && !p.includes("?");
  let regex = "";
  for (const ch of p) {
    if (ch === "*") regex += "[^/]*";
    else if (ch === "?") regex += "[^/]";
    else if (ch === "." || ch === "+" || ch === "(" || ch === ")" || ch === "{" || ch === "}" || ch === "|" || ch === "^" || ch === "$" || ch === "\\") regex += "\\" + ch;
    else regex += ch;
  }
  regex = (anchoredStart ? "^" : "(^|/)") + regex + (anchoredEnd ? "($|/)" : "");
  return { re: new RegExp(regex), dirOnly, baseOnly: !p.includes("/") };
}

function loadIgnorePatterns(folder: string): CompiledPattern[] {
  const file = path.join(folder, IGNORE_FILE_NAME);
  let content: string;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return [];
  }
  const out: CompiledPattern[] = [];
  for (const line of content.split(/\r?\n/)) {
    const compiled = compilePattern(line);
    if (compiled) out.push(compiled);
  }
  return out;
}

function matchesIgnore(relPath: string, isDir: boolean, patterns: CompiledPattern[]): boolean {
  const normalized = relPath.replace(/\\/g, "/");
  const base = path.posix.basename(normalized);
  for (const p of patterns) {
    if (p.dirOnly && !isDir) continue;
    if (p.baseOnly) {
      if (p.re.test(base)) return true;
    } else {
      if (p.re.test(normalized)) return true;
    }
  }
  return false;
}

function shouldIgnore(name: string, isDirectory: boolean): boolean {
  if (isDirectory && IGNORE_DIRS.has(name)) return true;
  if (name.endsWith(".bak")) return true;

  if (!isDirectory) {
    if (IGNORE_FILES_EXACT.has(name.toLowerCase())) return true;
    if (IGNORE_EXTENSIONS.has(path.extname(name).toLowerCase())) return true;
    // Patrones: archivos temporales de editores y OS
    if (name.endsWith("~")) return true; // backups de Vim/Emacs
    if (name.startsWith("._")) return true; // resource forks de macOS
    if (/^\.fuse_hidden/.test(name)) return true; // FUSE (Linux)
    if (/^\.nfs/.test(name)) return true; // NFS lock files (Linux)
    if (/^\.Trash-/.test(name)) return true; // papelera de Linux
  }

  return false;
}

async function collectPaths(
  dir: string,
  base: string,
  result: Map<string, string>,
  ignorePatterns: CompiledPattern[],
  onProgress: (current: string) => void,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  let lastYield = Date.now();
  for (const entry of entries) {
    if (signal?.aborted) return;
    // Symlinks no se siguen para evitar ciclos infinitos y ELOOP
    if (entry.isSymbolicLink()) {
      console.debug(`[scanner] skipping symlink: ${path.join(base, entry.name)}`);
      continue;
    }
    if (shouldIgnore(entry.name, entry.isDirectory())) continue;
    const rel = path.join(base, entry.name).replace(/\\/g, "/");
    if (matchesIgnore(rel, entry.isDirectory(), ignorePatterns)) continue;
    onProgress(rel);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.set(rel + "/", full);
      await new Promise<void>((resolve) => setImmediate(resolve));
      lastYield = Date.now();
      if (signal?.aborted) return;
      await collectPaths(full, rel, result, ignorePatterns, onProgress, signal);
    } else {
      result.set(rel, full);
    }
    if (Date.now() - lastYield > 50) {
      await new Promise<void>((resolve) => setImmediate(resolve));
      lastYield = Date.now();
    }
  }
}

async function buildTree(
  allPaths: Set<string>,
  leftMap: Map<string, string>,
  rightMap: Map<string, string>,
  onProgress: (file: string) => void,
  signal?: AbortSignal
): Promise<{ entries: FileEntry[]; stats: ScanStats }> {
  const stats: ScanStats = {
    identical: 0,
    different: 0,
    commentsOnly: 0,
    leftOnly: 0,
    rightOnly: 0,
    total: 0
  };

  // Build flat list of all unique relative paths (files only, no dir keys here)
  const filePaths = Array.from(allPaths).filter((p) => !p.endsWith("/"));

  // Build directory structure
  const dirMap = new Map<string, FileEntry>();
  const rootEntries: FileEntry[] = [];

  function getOrCreateDir(relDir: string): FileEntry {
    if (dirMap.has(relDir)) return dirMap.get(relDir)!;
    const parts = relDir.split("/").filter(Boolean);
    const name = parts[parts.length - 1];
    const entry: FileEntry = {
      relativePath: relDir,
      leftPath: leftMap.get(relDir + "/") ?? null,
      rightPath: rightMap.get(relDir + "/") ?? null,
      status: "identical",
      isDirectory: true,
      children: [],
      name,
      extension: "",
      leftSize: null,
      rightSize: null
    };
    dirMap.set(relDir, entry);
    const parentDir = parts.slice(0, -1).join("/");
    if (parentDir === "") {
      rootEntries.push(entry);
    } else {
      const parent = getOrCreateDir(parentDir);
      parent.children!.push(entry);
    }
    return entry;
  }

  let lastYield = Date.now();
  for (let i = 0; i < filePaths.length; i++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const rel = filePaths[i];
    onProgress(rel);
    const elapsed = Date.now() - lastYield;
    if (i > 0 && (i % 50 === 0 || elapsed > 50)) {
      await new Promise<void>((resolve) => setImmediate(resolve));
      lastYield = Date.now();
    }
    const ext = path.extname(rel).replace(".", "").toLowerCase();
    const leftPath = leftMap.get(rel) ?? null;
    const rightPath = rightMap.get(rel) ?? null;
    const status = await classifyFiles(leftPath, rightPath, ext);

    stats.total++;
    if (status === "identical") stats.identical++;
    else if (status === "different") stats.different++;
    else if (status === "comments-only") stats.commentsOnly++;
    else if (status === "left-only") stats.leftOnly++;
    else if (status === "right-only") stats.rightOnly++;

    const parts = rel.split("/");
    const name = parts[parts.length - 1];
    const leftSize = leftPath
      ? (() => {
          try {
            return fs.statSync(leftPath).size;
          } catch {
            return null;
          }
        })()
      : null;
    const rightSize = rightPath
      ? (() => {
          try {
            return fs.statSync(rightPath).size;
          } catch {
            return null;
          }
        })()
      : null;
    const fileEntry: FileEntry = {
      relativePath: rel,
      leftPath,
      rightPath,
      status,
      isDirectory: false,
      name,
      extension: ext,
      leftSize,
      rightSize
    };

    if (parts.length === 1) {
      rootEntries.push(fileEntry);
    } else {
      const parentDir = parts.slice(0, -1).join("/");
      const parent = getOrCreateDir(parentDir);
      parent.children!.push(fileEntry);
    }
  }

  // Sort: dirs first, then files, alphabetically
  function sortEntries(entries: FileEntry[]): void {
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const e of entries) {
      if (e.children) sortEntries(e.children);
    }
  }
  sortEntries(rootEntries);

  // Compute folder status: the most prevalent status among all descendant files
  function countDescendantStatuses(entry: FileEntry, counts: Record<string, number>): void {
    if (!entry.children) return;
    for (const child of entry.children) {
      if (child.isDirectory) {
        countDescendantStatuses(child, counts);
      } else {
        counts[child.status] = (counts[child.status] ?? 0) + 1;
      }
    }
  }

  function computeDirStatus(entry: FileEntry): void {
    if (!entry.isDirectory || !entry.children) return;
    for (const child of entry.children) {
      computeDirStatus(child);
    }
    const counts: Record<string, number> = {};
    countDescendantStatuses(entry, counts);
    if (Object.keys(counts).length === 0) {
      entry.status = "identical";
      return;
    }
    // Verde solo si TODOS los descendientes son idénticos
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if ((counts["identical"] ?? 0) === total) {
      entry.status = "identical";
      return;
    }
    // De lo contrario, el color predominante excluyendo verde
    const nonIdentical = Object.entries(counts).filter(([k]) => k !== "identical");
    const dominant = nonIdentical.sort((a, b) => b[1] - a[1])[0][0];
    entry.status = dominant as FileEntry["status"];
  }
  for (const entry of rootEntries) {
    computeDirStatus(entry);
  }

  // Calcular tamaños acumulados de carpetas
  function computeDirSizes(entry: FileEntry): void {
    if (!entry.isDirectory || !entry.children) return;
    for (const child of entry.children) {
      computeDirSizes(child);
    }
    let leftTotal = 0,
      rightTotal = 0;
    let hasLeft = false,
      hasRight = false;
    for (const child of entry.children) {
      if (child.leftSize !== null) {
        leftTotal += child.leftSize;
        hasLeft = true;
      }
      if (child.rightSize !== null) {
        rightTotal += child.rightSize;
        hasRight = true;
      }
    }
    entry.leftSize = hasLeft ? leftTotal : null;
    entry.rightSize = hasRight ? rightTotal : null;
  }
  for (const entry of rootEntries) {
    computeDirSizes(entry);
  }

  return { entries: rootEntries, stats };
}

export async function scanFolders(
  leftFolder: string,
  rightFolder: string,
  onProgress: (percent: number, currentFile: string) => void,
  signal?: AbortSignal
): Promise<ScanResult> {
  const leftMap = new Map<string, string>();
  const rightMap = new Map<string, string>();

  const ignorePatterns = [
    ...loadIgnorePatterns(leftFolder),
    ...loadIgnorePatterns(rightFolder)
  ];

  await collectPaths(leftFolder, "", leftMap, ignorePatterns, onProgress, signal);
  await collectPaths(rightFolder, "", rightMap, ignorePatterns, onProgress, signal);

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const allPaths = new Set([...leftMap.keys(), ...rightMap.keys()]);
  const total = Array.from(allPaths).filter((p) => !p.endsWith("/")).length;
  let processed = 0;

  const { entries, stats } = await buildTree(
    allPaths,
    leftMap,
    rightMap,
    (file) => {
      processed++;
      onProgress(Math.round((processed / total) * 100), file);
    },
    signal
  );

  return { files: entries, stats };
}
