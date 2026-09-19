import { existsSync, mkdtempSync, rmSync } from "node:fs";
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
