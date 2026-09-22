import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";

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

describe("integration: request-id middleware recipe", () => {
  const dir = mkdtempSync(join(tmpdir(), "chisel-reqid-"));

  beforeAll(async () => {
    expect((await runChisel(["init"], dir)).code).toBe(0);
    expect((await runChisel(["g", "middleware", "request-id", "--global"], dir)).code).toBe(0);
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("R-middleware-05: request-id recipe is not a TODO stub", () => {
    const src = readFileSync(join(dir, "src/app/middleware/request-id.ts"), "utf8");
    expect(src).toContain("randomUUID");
    expect(src).toContain('setHeader("X-Request-Id"');
    expect(src).not.toContain("TODO");
  });

  it("R-middleware-06: --global registers before requestLogger", () => {
    const app = readFileSync(join(dir, "src/app.ts"), "utf8");
    const chain = app.match(/const middleware: Middleware\[\] = \[([\s\S]*?)\];/);
    expect(chain).not.toBeNull();
    const body = chain![1]!;
    const idIdx = body.indexOf("requestIdMiddleware");
    const loggerIdx = body.indexOf("requestLogger");
    expect(idIdx).toBeGreaterThan(-1);
    expect(loggerIdx).toBeGreaterThan(-1);
    expect(idIdx).toBeLessThan(loggerIdx);
  });

  it("R-middleware-07: echoes X-Request-Id on /health", async () => {
    const port = 40_000 + Math.floor(Math.random() * 10_000);
    const child = spawn(process.execPath, [tsxCli, "src/main.ts"], {
      cwd: dir,
      env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      await waitForServer(port);

      const generated = await fetch(`http://127.0.0.1:${port}/health`);
      expect(generated.status).toBe(200);
      const genId = generated.headers.get("x-request-id");
      expect(genId).toBeTruthy();

      const echoed = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: { "X-Request-Id": "test-correlation" },
      });
      expect(echoed.headers.get("x-request-id")).toBe("test-correlation");
    } finally {
      const exitPromise = waitForProcessExit(child);
      child.kill("SIGTERM");
      await exitPromise;
    }
  });

  it("R-middleware-01: generic middleware remains a stub", async () => {
    const stubDir = mkdtempSync(join(tmpdir(), "chisel-mw-stub-"));
    try {
      expect((await runChisel(["init"], stubDir)).code).toBe(0);
      expect((await runChisel(["g", "middleware", "custom-hook"], stubDir)).code).toBe(0);
      const src = readFileSync(join(stubDir, "src/app/middleware/custom-hook.ts"), "utf8");
      expect(src).toContain("TODO");
    } finally {
      rmSync(stubDir, { recursive: true, force: true });
    }
  });
});
