import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";

const runE2e = process.env.CHISEL_E2E === "1";

describe.runIf(runE2e)("e2e: npm install in generated project", () => {
  const dir = mkdtempSync(join(tmpdir(), "chisel-e2e-"));

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("npm install && npm run build", async () => {
    expect((await runChisel(["init"], dir)).code).toBe(0);
    expect((await runChisel(["g", "resource", "users", "--crud"], dir)).code).toBe(0);
    execSync("npm install", { cwd: dir, stdio: "inherit" });
    execSync("npm run build", { cwd: dir, stdio: "inherit" });
  });
});
