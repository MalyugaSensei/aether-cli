import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";

describe("init", () => {
  it("R-init-03: refuses init when package.json exists without force", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-init-block-"));
    writeFileSync(join(dir, "package.json"), "{}");
    const r = await runChisel(["init"], dir);
    expect(r.code).not.toBe(0);
    expect(r.stderr + r.stdout).toMatch(/already|force/i);
  });
});
