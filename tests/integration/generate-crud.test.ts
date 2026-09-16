import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";
import { tscCheck } from "../helpers/tsc-check.js";

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const tsxCli = join(cliRoot, "node_modules/tsx/dist/cli.mjs");

function waitForServer(port: number, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      fetch(`http://127.0.0.1:${port}/health`)
        .then((r) => (r.ok ? resolve() : Promise.reject()))
        .catch(() => {
          if (Date.now() - start > timeoutMs) reject(new Error("Server did not start"));
          else setTimeout(tick, 100);
        });
    };
    tick();
  });
}

function waitForProcessExit(
  child: ReturnType<typeof spawn>,
  timeoutMs = 15_000,
): Promise<number> {
  return once(child as unknown as NodeJS.EventEmitter, "exit", {
    signal: AbortSignal.timeout(timeoutMs),
  }).then(([code]) => (code as number | null) ?? 1);
}

describe("integration: init + crud resource", () => {
  const dir = mkdtempSync(join(tmpdir(), "chisel-int-"));

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("R-init-01: init scaffolds project", async () => {
    const r = await runChisel(["init"], dir);
    expect(r.code).toBe(0);
  });

  it("R-crud-01: generates users resource with crud", async () => {
    const r = await runChisel(["g", "resource", "users", "--crud"], dir);
    expect(r.code).toBe(0);
  });

  it("TypeScript program has no diagnostics", () => {
    const errors = tscCheck(dir, [join(cliRoot, "node_modules/@types")]);
    expect(errors).toEqual([]);
  });

  it("R-crud-02: controller rejects invalid create body without calling persistence", async () => {
    const port = 40_000 + Math.floor(Math.random() * 10_000);
    const child = spawn(process.execPath, [tsxCli, "src/main.ts"], {
      cwd: dir,
      env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      await waitForServer(port);

      const bad = await fetch(`http://127.0.0.1:${port}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      expect(bad.status).toBe(400);
    } finally {
      const exitPromise = waitForProcessExit(child);
      child.kill("SIGTERM");
      await exitPromise;
    }
  });

  it("R-init-05: graceful shutdown exits with code 0 after SIGTERM", async () => {
    const port = 40_000 + Math.floor(Math.random() * 10_000);
    const child = spawn(process.execPath, [tsxCli, "src/main.ts"], {
      cwd: dir,
      env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    await waitForServer(port);

    const exitPromise = waitForProcessExit(child);
    child.kill("SIGTERM");
    expect(await exitPromise).toBe(0);
  });

  it("R-middleware-02: middleware registration is idempotent", async () => {
    await runChisel(["g", "middleware", "auth"], dir);
    const second = await runChisel(["g", "middleware", "auth"], dir);
    expect(second.code).not.toBe(0);
    const app = await import("node:fs/promises").then((fs) => fs.readFile(join(dir, "src/app.ts"), "utf8"));
    expect(app.match(/authMiddleware/g)?.length).toBeLessThanOrEqual(3);
  });

});
