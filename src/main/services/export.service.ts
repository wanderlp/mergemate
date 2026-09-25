import type { ScanResult } from "../../types";

export type ExportFormat = "csv" | "json" | "markdown";

const STATUS_LABELS: Record<string, string> = {
  identical: "Idéntico",
  different: "Diferente",
  "comments-only": "Solo comentarios",
  "left-only": "Solo en izquierda",
  "right-only": "Solo en derecha"
};

function flattenEntries(entries: ScanResult["files"]): Array<{
  relativePath: string;
  status: string;
  leftSize: number | null;
  rightSize: number | null;
}> {
  const flat: Array<{
    relativePath: string;
    status: string;
    leftSize: number | null;
    rightSize: number | null;
  }> = [];
  function walk(list: ScanResult["files"]): void {
    for (const e of list) {
      if (!e.isDirectory) {
        flat.push({
          relativePath: e.relativePath,
          status: e.status,
          leftSize: e.leftSize,
          rightSize: e.rightSize
        });
      }
      if (e.children) walk(e.children);
    }
  }
  walk(entries);
  return flat;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeCsv(result: ScanResult): string {
  const BOM = "\uFEFF";
  const lines: string[] = ["relativePath,status,leftSize,rightSize"];
  for (const row of flattenEntries(result.files)) {
    lines.push(
      [csvEscape(row.relativePath), csvEscape(row.status), row.leftSize ?? "", row.rightSize ?? ""].join(",")
    );
  }
  return BOM + lines.join("\n") + "\n";
}

export function serializeJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2) + "\n";
}

function fmtSize(n: number | null): string {
  if (n === null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function serializeMarkdown(result: ScanResult): string {
  const s = result.stats;
  const lines: string[] = [];
  lines.push(`# Reporte de comparación`);
  lines.push("");
  lines.push(`**Generado:** ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Estadísticas");
  lines.push("");
  lines.push("| Métrica | Valor |");
  lines.push("| --- | --- |");
  lines.push(`| Idénticos | ${s.identical} |`);
  lines.push(`| Diferentes | ${s.different} |`);
  lines.push(`| Solo comentarios | ${s.commentsOnly} |`);
  lines.push(`| Solo en izquierda | ${s.leftOnly} |`);
  lines.push(`| Solo en derecha | ${s.rightOnly} |`);
  lines.push(`| **Total archivos** | **${s.total}** |`);
  lines.push("");
  lines.push("## Archivos");
  lines.push("");
  lines.push("| Ruta | Estado | Tamaño izquierdo | Tamaño derecho |");
  lines.push("| --- | --- | --- | --- |");
  for (const row of flattenEntries(result.files)) {
    lines.push(
      `| ${row.relativePath.replace(/\|/g, "\\|")} | ${STATUS_LABELS[row.status] ?? row.status} | ${fmtSize(row.leftSize)} | ${fmtSize(row.rightSize)} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}
