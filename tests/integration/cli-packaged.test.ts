import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function runBuilt(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(cliRoot, "dist/cli.js"), ...args], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

describe("packaged CLI", () => {
  it("R-packaging-01: dist cli init succeeds", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-pack-"));
    const r = await runBuilt(["init"], dir);
    expect(r.code, r.stderr || r.stdout).toBe(0);
  });

  it("R-help-01: dist cli help includes quick-start aether init", async () => {
    const r = await runBuilt(["help", "--no-color"], cliRoot);
    expect(r.code, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/aether init/);
    expect(r.stdout).toMatch(/QUICK START/);
  });

  it("R-help-02: built CLI ships dist/help/guide.txt", () => {
    const guidePath = join(cliRoot, "dist/help/guide.txt");
    expect(existsSync(guidePath)).toBe(true);
  });
});
