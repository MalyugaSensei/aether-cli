import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SourceFile } from "ts-morph";
import { Project } from "ts-morph";
import { formatContents } from "./render.js";

export type FileOp =
  | { kind: "create"; path: string; contents: string }
  | { kind: "modify"; path: string; edit: (sf: SourceFile) => void };

export interface CommitOptions {
  dryRun?: boolean;
  force?: boolean;
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

export async function commitPlan(
  root: string,
  ops: FileOp[],
  options: CommitOptions = {},
): Promise<void> {
  if (options.dryRun) {
    printPlan(ops);
    return;
  }

  const modifyOps = ops.filter((o): o is Extract<FileOp, { kind: "modify" }> => o.kind === "modify");
  const createOps = ops.filter((o): o is Extract<FileOp, { kind: "create" }> => o.kind === "create");

  for (const op of createOps) {
    const abs = join(root, op.path);
    if (existsSync(abs) && !options.force) {
      throw new Error(`File already exists: ${op.path}. Use --force to overwrite.`);
    }
  }

  const morph = new Project({
    useInMemoryFileSystem: false,
    skipAddingFilesFromTsConfig: true,
  });

  for (const op of modifyOps) {
    const abs = join(root, op.path);
    if (!existsSync(abs)) {
      throw new Error(`Cannot modify missing file: ${op.path}`);
    }
    morph.addSourceFileAtPath(abs);
  }

  for (const op of createOps) {
    const abs = join(root, op.path);
    const formatted = await formatContents(op.contents, op.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, formatted, "utf8");
  }

  for (const op of modifyOps) {
    const abs = join(root, op.path);
    const sf = morph.getSourceFile(abs);
    if (!sf) continue;
    op.edit(sf);
    const text = sf.getFullText();
    const formatted = await formatContents(text, op.path);
    writeFileSync(abs, formatted, "utf8");
  }
}

export function pathExists(root: string, rel: string): boolean {
  return existsSync(join(root, rel));
}

export function readProjectFile(root: string, rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}
