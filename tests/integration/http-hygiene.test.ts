import { mkdtempSync, rmSync } from "node:fs";
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

async function withServer(
  dir: string,
  env: NodeJS.ProcessEnv,
  fn: (port: number) => Promise<void>,
): Promise<void> {
  const port = 40_000 + Math.floor(Math.random() * 10_000);
  const child = spawn(process.execPath, [tsxCli, "src/main.ts"], {
    cwd: dir,
    env: { ...process.env, ...env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await waitForServer(port);
    await fn(port);
  } finally {
    const exitPromise = waitForProcessExit(child);
    child.kill("SIGTERM");
    await exitPromise;
  }
}

describe("integration: http hygiene", () => {
  const dir = mkdtempSync(join(tmpdir(), "chisel-http-"));

  beforeAll(async () => {
    const r = await runChisel(["init"], dir);
    expect(r.code, r.stderr || r.stdout).toBe(0);
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("R-init-15: parseListQuery defaults and rejects oversized limit", async () => {
    const child = spawn(
      process.execPath,
      [
        tsxCli,
        "-e",
        `import { parseListQuery, LIST_DEFAULT_LIMIT } from "./src/app/list";
const ok = parseListQuery(new URLSearchParams(""));
if (!ok.ok || ok.value.limit !== LIST_DEFAULT_LIMIT || ok.value.offset !== 0) process.exit(2);
const paged = parseListQuery(new URLSearchParams("limit=10&offset=3"));
if (!paged.ok || paged.value.limit !== 10 || paged.value.offset !== 3) process.exit(3);
const bad = parseListQuery(new URLSearchParams("limit=101"));
if (bad.ok) process.exit(4);`,
      ],
      { cwd: dir, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
    );
    const [code] = await once(child, "exit");
    expect(code).toBe(0);
  });

  it("R-init-13: CORS_ORIGIN reflects Origin and answers OPTIONS", async () => {
    await withServer(dir, { CORS_ORIGIN: "http://localhost:5173", BEARER_TOKEN: "" }, async (port) => {
      const origin = "http://localhost:5173";
      const preflight = await fetch(`http://127.0.0.1:${port}/health`, {
        method: "OPTIONS",
        headers: { Origin: origin, "Access-Control-Request-Method": "GET" },
      });
      expect(preflight.status).toBe(204);
      expect(preflight.headers.get("access-control-allow-origin")).toBe(origin);

      const get = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: { Origin: origin },
      });
      expect(get.status).toBe(200);
      expect(get.headers.get("access-control-allow-origin")).toBe(origin);
    });
  });

  it("R-init-12: Content-Length over BODY_LIMIT_BYTES is 413", async () => {
    await withServer(dir, { BODY_LIMIT_BYTES: "16", BEARER_TOKEN: "" }, async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/unused`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(64),
      });
      expect(res.status).toBe(413);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe("Request body too large");
    });
  });

  it("R-init-14: BEARER_TOKEN protects non-health routes", async () => {
    await withServer(dir, { BEARER_TOKEN: "secret-token", CORS_ORIGIN: "" }, async (port) => {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.status).toBe(200);

      const denied = await fetch(`http://127.0.0.1:${port}/missing`);
      expect(denied.status).toBe(401);

      const allowed = await fetch(`http://127.0.0.1:${port}/missing`, {
        headers: { Authorization: "Bearer secret-token" },
      });
      expect(allowed.status).toBe(404);
    });
  });
});
