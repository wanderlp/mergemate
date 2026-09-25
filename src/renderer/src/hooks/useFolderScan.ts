import { useState, useCallback, useEffect, useRef } from "react";
import type { ScanResult, ScanProgress, FileEntry, FileStatus } from "../types";

function patchEntryInTree(
  files: FileEntry[],
  relativePath: string,
  status: FileStatus
): FileEntry[] {
  return files.map((f) => {
    if (f.relativePath === relativePath) return { ...f, status };
    if (f.isDirectory && f.children)
      return { ...f, children: patchEntryInTree(f.children, relativePath, status) };
    return f;
  });
}

interface UseFolderScanReturn {
  scanResult: ScanResult | null;
  scanCount: number;
  scanning: boolean;
  progress: ScanProgress | null;
  leftFolder: string;
  rightFolder: string;
  setLeftFolder: (path: string) => void;
  setRightFolder: (path: string) => void;
  scan: () => Promise<void>;
  cancelScan: () => void;
  swapFolders: () => Promise<void>;
  openLeft: () => Promise<void>;
  openRight: () => Promise<void>;
  clear: () => void;
  patchFileStatus: (relativePath: string, status: FileStatus) => void;
}

export function useFolderScan(): UseFolderScanReturn {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [leftFolder, setLeftFolder] = useState("");
  const [rightFolder, setRightFolder] = useState("");
  const autoScanRef = useRef(false);
  const scanAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    window.electronAPI.getPendingFolders().then((pending) => {
      if (pending?.left || pending?.right) {
        if (pending?.left) setLeftFolder(pending.left);
        if (pending?.right) setRightFolder(pending.right);
        if (pending?.left && pending?.right) {
          autoScanRef.current = true;
        }
      } else {
        void window.electronAPI.getLastSession().then((session) => {
          if (session.leftFolder) setLeftFolder(session.leftFolder);
          if (session.rightFolder) setRightFolder(session.rightFolder);
          if (session.leftFolder && session.rightFolder) {
            autoScanRef.current = true;
          }
        });
      }
    });

    const unsubscribe = window.electronAPI.onScanProgress((p) => {
      setProgress(p);
    });
    return () => {
      unsubscribe();
      scanAbortRef.current?.abort();
    };
  }, []);

  const scan = useCallback(
    async (leftOverride?: string, rightOverride?: string) => {
      scanAbortRef.current?.abort();
      const controller = new AbortController();
      scanAbortRef.current = controller;
      const signal = controller.signal;

      const left = leftOverride ?? leftFolder;
      const right = rightOverride ?? rightFolder;
      if (!left || !right) return;
      setScanning(true);
      setProgress({ percent: 0, currentFile: "" });
      try {
        if (signal.aborted) return;
        await window.electronAPI.saveRecentComparison(left, right);
        if (signal.aborted) return;
        try {
          const result = await window.electronAPI.scanFolder(left, right);
          if (signal.aborted) return;
          setScanResult(result);
          setScanCount((c) => c + 1);
        } catch (err) {
          if (signal.aborted) return;
          throw err;
        }
      } finally {
        if (!signal.aborted) {
          setScanning(false);
          setProgress(null);
        }
      }
    },
    [leftFolder, rightFolder]
  );

  const cancelScan = useCallback(() => {
    scanAbortRef.current?.abort();
    void window.electronAPI.cancelScan();
  }, []);

  const swapFolders = useCallback(async () => {
    if (!leftFolder || !rightFolder) return;
    setLeftFolder(rightFolder);
    setRightFolder(leftFolder);
    await scan(rightFolder, leftFolder);
  }, [leftFolder, rightFolder, scan]);

  // Auto-scan cuando se cargan carpetas desde recientes
  useEffect(() => {
    if (autoScanRef.current && leftFolder && rightFolder) {
      autoScanRef.current = false;
      scan();
    }
  }, [leftFolder, rightFolder, scan]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void window.electronAPI.setLastSession({ leftFolder, rightFolder });
    }, 300);
    return () => clearTimeout(handle);
  }, [leftFolder, rightFolder]);

  const openLeft = useCallback(async () => {
    const folder = await window.electronAPI.showFolderDialog();
    if (folder) setLeftFolder(folder);
  }, []);

  const openRight = useCallback(async () => {
    const folder = await window.electronAPI.showFolderDialog();
    if (folder) setRightFolder(folder);
  }, []);

  const clear = useCallback(() => {
    setLeftFolder("");
    setRightFolder("");
    setScanResult(null);
    setProgress(null);
  }, []);

  const patchFileStatus = useCallback((relativePath: string, status: FileStatus) => {
    setScanResult((prev) => {
      if (!prev) return prev;
      return { ...prev, files: patchEntryInTree(prev.files, relativePath, status) };
    });
  }, []);

  return {
    scanResult,
    scanCount,
    scanning,
    progress,
    leftFolder,
    rightFolder,
    setLeftFolder,
    setRightFolder,
    scan,
    cancelScan,
    swapFolders,
    openLeft,
    openRight,
    clear,
    patchFileStatus
  };
}
