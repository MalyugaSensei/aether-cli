import { mkdtempSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Project } from "ts-morph";
import { appendToArrayLiteralIfMissing } from "../../src/core/ast.js";
import { FILE_OP } from "../../src/core/constants.js";
import { commitPlan, materializePlan, type FileOp } from "../../src/core/plan.js";

describe("plan", () => {
  it("R-plan-01: dry-run does not write files", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-dry-"));
    const ops: FileOp[] = [{ kind: FILE_OP.create, path: "foo.txt", contents: "bar" }];
    await commitPlan(dir, ops, { dryRun: true });
    expect(existsSync(join(dir, "foo.txt"))).toBe(false);
  });

  it("commitPlan creates files on disk", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-commit-"));
    const ops: FileOp[] = [{ kind: FILE_OP.create, path: "foo.txt", contents: "bar\n" }];
    await commitPlan(dir, ops, {});
    expect(readFileSync(join(dir, "foo.txt"), "utf8")).toContain("bar");
  });

  it("create with overwrite replaces an existing file without force", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-overwrite-"));
    writeFileSync(join(dir, "foo.txt"), "old\n");
    const ops: FileOp[] = [{ kind: FILE_OP.create, path: "foo.txt", contents: "new\n", overwrite: true }];
    await commitPlan(dir, ops, {});
    expect(readFileSync(join(dir, "foo.txt"), "utf8")).toContain("new");
  });

  it("R-plan-02: failed modify does not leave prior creates behind", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-rollback-"));
    writeFileSync(join(dir, "app.ts"), "const routes: string[] = [];\n");
    const ops: FileOp[] = [
      { kind: FILE_OP.create, path: "new.txt", contents: "x" },
      {
        kind: FILE_OP.modify,
        path: "app.ts",
        edit(sf) {
          appendToArrayLiteralIfMissing(sf, "missingArray", "x", false);
        },
      },
    ];
    await expect(materializePlan(dir, ops)).rejects.toThrow();
    expect(existsSync(join(dir, "new.txt"))).toBe(false);
  });
});
