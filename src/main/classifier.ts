import * as crypto from "crypto";
import * as fsp from "fs/promises";
import { normalize } from "./commentStripper";
import type { FileStatus } from "../types";

export async function hashFile(filePath: string): Promise<string> {
  const buf = await fsp.readFile(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function classifyFiles(
  leftPath: string | null,
  rightPath: string | null,
  ext: string
): Promise<FileStatus> {
  if (!leftPath && rightPath) return "right-only";
  if (leftPath && !rightPath) return "left-only";
  if (!leftPath || !rightPath) return "left-only";

  // Step 1: hash comparison
  const [leftHash, rightHash] = await Promise.all([
    hashFile(leftPath),
    hashFile(rightPath)
  ]);
  if (leftHash === rightHash) return "identical";

  // Step 2: comment-stripped comparison
  try {
    const [leftContent, rightContent] = await Promise.all([
      fsp.readFile(leftPath, "utf-8"),
      fsp.readFile(rightPath, "utf-8")
    ]);
    const leftNorm = normalize(leftContent, ext);
    const rightNorm = normalize(rightContent, ext);
    if (leftNorm === rightNorm) return "comments-only";
  } catch {
    // binary files or read errors — treat as different
  }

  return "different";
}
