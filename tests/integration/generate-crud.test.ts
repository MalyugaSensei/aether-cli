import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterAll, describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const tsxCli = join(cliRoot, "node_modules/tsx/dist/cli.mjs");

function tscCheck(projectDir: string): string[] {
  const configPath = join(projectDir, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectDir);
  parsed.options.typeRoots = [join(cliRoot, "node_modules/@types")];
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  return diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

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
    const errors = tscCheck(dir);
    expect(errors).toEqual([]);
  });

  it("R-crud-03: CRUD endpoints respond correctly", async () => {
    const port = 40_000 + Math.floor(Math.random() * 10_000);
    const child = spawn(process.execPath, [tsxCli, "src/main.ts"], {
      cwd: dir,
      env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      await waitForServer(port);

      const list1 = await fetch(`http://127.0.0.1:${port}/users`);
      expect(list1.status).toBe(200);
      expect(await list1.json()).toEqual([]);

      const bad = await fetch(`http://127.0.0.1:${port}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      expect(bad.status).toBe(400);

      const created = await fetch(`http://127.0.0.1:${port}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ada" }),
      });
      expect(created.status).toBe(201);
      const entity = (await created.json()) as { id: string; name: string };
      expect(entity.name).toBe("Ada");

      const got = await fetch(`http://127.0.0.1:${port}/users/${entity.id}`);
      expect(got.status).toBe(200);

      const patched = await fetch(`http://127.0.0.1:${port}/users/${entity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Grace" }),
      });
      expect(patched.status).toBe(200);

      const deleted = await fetch(`http://127.0.0.1:${port}/users/${entity.id}`, {
        method: "DELETE",
      });
      expect(deleted.status).toBe(204);

      const missing = await fetch(`http://127.0.0.1:${port}/users/${entity.id}`);
      expect(missing.status).toBe(404);
    } finally {
      child.kill("SIGTERM");
    }
  });

  it("R-middleware-02: middleware registration is idempotent", async () => {
    await runChisel(["g", "middleware", "auth"], dir);
    const second = await runChisel(["g", "middleware", "auth"], dir);
    expect(second.code).not.toBe(0);
    const app = await import("node:fs/promises").then((fs) => fs.readFile(join(dir, "src/app.ts"), "utf8"));
    expect(app.match(/authMiddleware/g)?.length).toBeLessThanOrEqual(3);
  });

});
