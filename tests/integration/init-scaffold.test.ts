import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";
import { INIT_SCAFFOLD_FILES } from "../helpers/init-expected-files.js";

describe("integration: init scaffold", () => {
  it("R-init-01: creates the full set of files for a basic HTTP service", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-init-01-"));
    try {
      const r = await runChisel(["init"], dir);
      expect(r.code, r.stderr || r.stdout).toBe(0);
      for (const rel of INIT_SCAFFOLD_FILES) {
        expect(existsSync(join(dir, rel)), `missing ${rel}`).toBe(true);
      }
      expect(existsSync(join(dir, ".env"))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("R-init-18: npm test runs health HTTP smoke", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-init-18-"));
    try {
      expect((await runChisel(["init"], dir)).code).toBe(0);
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
        scripts?: { test?: string };
      };
      expect(pkg.scripts?.test).toContain("node --import tsx --test");
      execSync("npm install", { cwd: dir, stdio: "pipe" });
      execSync("npm test", { cwd: dir, stdio: "pipe" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("R-init-16: init --dry-run does not write scaffold files", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-init-dry-"));
    try {
      const r = await runChisel(["init", "--dry-run"], dir);
      expect(r.code, r.stderr || r.stdout).toBe(0);
      for (const rel of INIT_SCAFFOLD_FILES) {
        expect(existsSync(join(dir, rel)), `should not create ${rel}`).toBe(false);
      }
      expect(existsSync(join(dir, ".env"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
