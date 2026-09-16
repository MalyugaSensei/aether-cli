import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { commitPlan, type FileOp } from "../../src/core/plan.js";

describe("plan", () => {
  it("R-init-01 dry-run does not write files", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-dry-"));
    const ops: FileOp[] = [{ kind: "create", path: "foo.txt", contents: "bar" }];
    await commitPlan(dir, ops, { dryRun: true });
    expect(existsSync(join(dir, "foo.txt"))).toBe(false);
  });

  it("creates file on commit", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-commit-"));
    const ops: FileOp[] = [{ kind: "create", path: "foo.txt", contents: "bar\n" }];
    await commitPlan(dir, ops, {});
    expect(readFileSync(join(dir, "foo.txt"), "utf8")).toContain("bar");
  });
});
