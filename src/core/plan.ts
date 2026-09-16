import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import type { SourceFile } from "ts-morph";
import { Project } from "ts-morph";
import { ChiselError, ErrorCode } from "./errors.js";
import { formatMaterializedDiff, planToJson } from "./diff.js";
import { formatContents } from "./render.js";

export type FileOp =
  | { kind: "create"; path: string; contents: string }
  | { kind: "modify"; path: string; edit: (sf: SourceFile) => void };

export interface MaterializedOp {
  kind: "create" | "modify";
  path: string;
  contents: string;
  previousContents?: string;
}

export interface CommitOptions {
  dryRun?: boolean;
  force?: boolean;
  json?: boolean;
  showDiff?: boolean;
  checkOnly?: boolean;
}

export function printPlan(ops: FileOp[]): void {
  for (const op of ops) {
    if (op.kind === "create") {
      console.log(`create ${op.path}`);
    } else {
      console.log(`modify ${op.path}`);
    }
  }
}

export async function materializePlan(
  root: string,
  ops: FileOp[],
  options: Pick<CommitOptions, "force"> = {},
): Promise<MaterializedOp[]> {
  const createOps = ops.filter((o): o is Extract<FileOp, { kind: "create" }> => o.kind === "create");
  const modifyOps = ops.filter((o): o is Extract<FileOp, { kind: "modify" }> => o.kind === "modify");

  for (const op of createOps) {
    const abs = join(root, op.path);
    if (existsSync(abs) && !options.force) {
      throw new ChiselError(ErrorCode.ALREADY_EXISTS, `File already exists: ${op.path}. Use --force to overwrite.`);
    }
  }

  const morphMem = new Project({ useInMemoryFileSystem: true });
  const materialized: MaterializedOp[] = [];

  for (const op of createOps) {
    const formatted = await formatContents(op.contents, op.path);
    const abs = join(root, op.path);
    materialized.push({
      kind: "create",
      path: op.path,
      contents: formatted,
      previousContents: existsSync(abs) ? readFileSync(abs, "utf8") : undefined,
    });
  }

  for (const op of modifyOps) {
    const abs = join(root, op.path);
    if (!existsSync(abs)) {
      throw new ChiselError(ErrorCode.NOT_FOUND, `Cannot modify missing file: ${op.path}`);
    }
    const previousContents = readFileSync(abs, "utf8");
    const sf = morphMem.createSourceFile(abs, previousContents);
    op.edit(sf);
    const next = await formatContents(sf.getFullText(), op.path);
    materialized.push({
      kind: "modify",
      path: op.path,
      contents: next,
      previousContents,
    });
  }

  return materialized;
}

export async function applyMaterializedPlan(root: string, materialized: MaterializedOp[]): Promise<void> {
  const backups: Array<{ abs: string; contents: string | null; existed: boolean }> = [];

  try {
    for (const op of materialized) {
      const abs = join(root, op.path);
      backups.push({
        abs,
        contents: existsSync(abs) ? readFileSync(abs, "utf8") : null,
        existed: existsSync(abs),
      });
      mkdirSync(dirname(abs), { recursive: true });
      const tmp = `${abs}.aether.tmp`;
      writeFileSync(tmp, op.contents, "utf8");
      renameSync(tmp, abs);
    }
  } catch (err) {
    for (const backup of backups.reverse()) {
      if (backup.existed && backup.contents !== null) {
        writeFileSync(backup.abs, backup.contents, "utf8");
      } else if (existsSync(backup.abs)) {
        unlinkSync(backup.abs);
      }
    }
    throw err;
  }
}

export async function commitPlan(
  root: string,
  ops: FileOp[],
  options: CommitOptions = {},
): Promise<{ materialized: MaterializedOp[]; changed: boolean }> {
  const materialized = await materializePlan(root, ops, { force: options.force });
  const changed = materialized.some(
    (op) => op.kind === "create" || op.previousContents !== op.contents,
  );

  if (options.checkOnly) {
    if (options.json) {
      console.log(JSON.stringify({ changed, plan: planToJson(ops) }, null, 2));
    }
    if (changed) {
      throw new ChiselError(ErrorCode.VALIDATION, "Project drift: planned changes are required.");
    }
    return { materialized, changed };
  }

  if (options.dryRun) {
    if (options.json) {
      console.log(JSON.stringify({ plan: planToJson(ops), materialized: materialized.map((m) => ({ kind: m.kind, path: m.path })) }, null, 2));
    } else {
      printPlan(ops);
    }
    if (options.showDiff) {
      const diff = formatMaterializedDiff(materialized);
      if (diff) console.log(diff);
    }
    return { materialized, changed };
  }

  await applyMaterializedPlan(root, materialized);
  return { materialized, changed };
}

export function pathExists(root: string, rel: string): boolean {
  return existsSync(join(root, rel));
}

export function readProjectFile(root: string, rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

/** Remove leftover temp files from failed runs (best-effort). */
export function cleanupTempFiles(root: string): void {
  // no-op placeholder; tmp files are renamed atomically
  void root;
  void rmSync;
}
