import * as crypto from "crypto";
import { createReadStream } from "fs";
import * as fsp from "fs/promises";
import { normalize } from "./commentStripper";
import type { FileStatus } from "../types";

// Umbral a partir del cual usamos hashing incremental por chunks.
// Para archivos menores, el overhead de chunks + setImmediate + stream
// API es mayor que el beneficio. 50MB es el valor sugerido por #26.
const INCREMENTAL_HASH_THRESHOLD_BYTES = 50 * 1024 * 1024;

// Tamaño de chunk para la lectura incremental. 1MB ofrece buen
// compromiso entre syscalls y latencia de yield.
const HASH_CHUNK_SIZE_BYTES = 1024 * 1024;

// Cada cuántos chunks cedemos control al event loop con setImmediate.
// Combinado con el check de 50ms abajo, cubre archivos rápidos y lentos.
const HASH_YIELD_EVERY_N_CHUNKS = 4;

// Yield si han pasado ~50ms desde el último yield (cubre el caso de
// archivos chicos leídos rápido donde el check por chunks no aplica).
const HASH_YIELD_MIN_INTERVAL_MS = 50;

export async function hashFile(filePath: string, signal?: AbortSignal): Promise<string> {
  // Stat para decidir path. Es async para no bloquear el main thread.
  const stat = await fsp.stat(filePath);

  // Fast path: archivo pequeño → lectura completa + hash de una sola vez.
  // Sigue siendo abortable vía { signal } en readFile (Node 16+).
  if (stat.size < INCREMENTAL_HASH_THRESHOLD_BYTES) {
    const buf = await fsp.readFile(filePath, { signal });
    return crypto.createHash("sha256").update(buf).digest("hex");
  }

  // Slow path: archivo grande → hash incremental por chunks con
  // yield periódico al event loop. Permite responder a la cancelación
  // en <100ms aunque falten GB por procesar.
  const hash = crypto.createHash("sha256");
  const stream = createReadStream(filePath, {
    highWaterMark: HASH_CHUNK_SIZE_BYTES,
    signal
  });

  let chunksProcessed = 0;
  let lastYield = Date.now();

  try {
    for await (const chunk of stream) {
      // Chequeamos la señal ANTES de procesar el chunk para responder
      // a la cancelación lo antes posible. Si la señal disparó entre
      // yields, Node ya destruyó el stream y la siguiente iteración
      // tira AbortError — el catch lo normaliza a DOMException.
      if (signal?.aborted) {
        stream.destroy();
        throw new DOMException("Aborted", "AbortError");
      }

      hash.update(chunk as Buffer);
      chunksProcessed++;

      if (
        chunksProcessed % HASH_YIELD_EVERY_N_CHUNKS === 0 ||
        Date.now() - lastYield > HASH_YIELD_MIN_INTERVAL_MS
      ) {
        await new Promise<void>((resolve) => setImmediate(resolve));
        lastYield = Date.now();
      }
    }
    return hash.digest("hex");
  } catch (err) {
    // Normalizamos cualquier error de cancelación a DOMException para
    // consistencia con buildTree:197 y scanFolders:359 (resto del codebase).
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    throw err;
  }
}

export async function classifyFiles(
  leftPath: string | null,
  rightPath: string | null,
  ext: string,
  signal?: AbortSignal
): Promise<FileStatus> {
  if (!leftPath && rightPath) return "right-only";
  if (leftPath && !rightPath) return "left-only";
  if (!leftPath || !rightPath) return "left-only";

  // Step 1: hash comparison
  const [leftHash, rightHash] = await Promise.all([
    hashFile(leftPath, signal),
    hashFile(rightPath, signal)
  ]);
  if (leftHash === rightHash) return "identical";

  // Step 2: comment-stripped comparison
  try {
    const [leftContent, rightContent] = await Promise.all([
      fsp.readFile(leftPath, { encoding: "utf-8", signal }),
      fsp.readFile(rightPath, { encoding: "utf-8", signal })
    ]);
    const leftNorm = normalize(leftContent, ext);
    const rightNorm = normalize(rightContent, ext);
    if (leftNorm === rightNorm) return "comments-only";
  } catch {
    // Si fue por cancelación, re-lanzamos para que buildTree termine
    // el scan limpiamente (catch DOMException AbortError).
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    // binary files or read errors — treat as different
  }

  return "different";
}
