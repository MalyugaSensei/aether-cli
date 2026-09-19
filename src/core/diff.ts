import { FILE_OP, type FileOpKind } from "./constants.js";

export interface PlanOpJson {
  kind: FileOpKind;
  path: string;
}

export interface PlanJson {
  ops: PlanOpJson[];
}

export function planToJson(ops: { kind: FileOpKind; path: string }[]): PlanJson {
  return {
    ops: ops.map((op) => ({ kind: op.kind, path: op.path })),
  };
}

export function formatUnifiedDiff(path: string, before: string, after: string): string {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const lines: string[] = [`--- a/${path}`, `+++ b/${path}`];
  const max = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < max; i++) {
    const b = beforeLines[i];
    const a = afterLines[i];
    if (b === a) {
      if (b !== undefined) lines.push(` ${b}`);
      continue;
    }
    if (b !== undefined) lines.push(`-${b}`);
    if (a !== undefined) lines.push(`+${a}`);
  }
  return lines.join("\n");
}

export function formatMaterializedDiff(
  materialized: Array<{ kind: string; path: string; contents: string; previousContents?: string }>,
): string {
  const chunks: string[] = [];
  for (const op of materialized) {
    if (op.kind === FILE_OP.create) {
      chunks.push(formatUnifiedDiff(op.path, "", op.contents));
    } else if (op.previousContents !== undefined && op.previousContents !== op.contents) {
      chunks.push(formatUnifiedDiff(op.path, op.previousContents, op.contents));
    }
  }
  return chunks.filter(Boolean).join("\n\n");
}
