import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

function wireUsersFakeRepository(dir: string): void {
  const compPath = join(dir, "src/app/composition.ts");
  let src = readFileSync(compPath, "utf8");
  src = src.replace(
    'import { createUserModule } from "../users/users.module";',
    `import { createUserModule } from "../users/users.module";\nimport { createFakeUserRepository } from "../../tests/users.repository.fake";`,
  );
  src = src.replace(
    "createUserModule({}).routes",
    "createUserModule({ repository: createFakeUserRepository() }).routes",
  );
  writeFileSync(compPath, src);
}

describe("integration: init + crud resource", () => {
  const dir = mkdtempSync(join(tmpdir(), "chisel-int-"));

  beforeAll(async () => {
    expect((await runChisel(["init"], dir)).code).toBe(0);
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("R-crud-01: generates users resource with crud", async () => {
    const r = await runChisel(["g", "resource", "users", "--crud"], dir);
    expect(r.code).toBe(0);
  });

  it("R-resource-04: --tests on existing CRUD adds tests/ only", async () => {
    const compBefore = readFileSync(join(dir, "src/app/composition.ts"), "utf8");
    const r = await runChisel(["g", "resource", "users", "--tests"], dir);
    expect(r.code).toBe(0);
    const fake = join(dir, "tests/users.repository.fake.ts");
    const modTest = join(dir, "tests/users.module.test.ts");
    const httpTest = join(dir, "tests/users.http.test.ts");
    expect(existsSync(fake)).toBe(true);
    expect(existsSync(modTest)).toBe(true);
    expect(existsSync(httpTest)).toBe(true);
    expect(readFileSync(join(dir, "src/app/composition.ts"), "utf8")).toBe(compBefore);
  });

  it("R-resource-06: HTTP smoke passes without composition wiring", async () => {
    execSync("npm install", { cwd: dir, stdio: "pipe" });
    execSync("npm test", { cwd: dir, stdio: "pipe" });
    const http = readFileSync(join(dir, "tests/users.http.test.ts"), "utf8");
    expect(http).toContain("withHttpServer(appRoutesWithFakeRepository()");
    expect(http).toContain("createFakeUserRepository");
    expect(http).not.toContain("composition.ts");
  });

  it("TypeScript program has no diagnostics", () => {
    const errors = tscCheck(dir, [join(cliRoot, "node_modules/@types")]);
    expect(errors).toEqual([]);
  });

  it("R-composition-02: CRUD returns 501 without repository wiring", async () => {
    const port = 40_000 + Math.floor(Math.random() * 10_000);
    const child = spawn(process.execPath, [tsxCli, "src/main.ts"], {
      cwd: dir,
      env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      await waitForServer(port);

      const res = await fetch(`http://127.0.0.1:${port}/users`);
      expect(res.status).toBe(501);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe("Repository not configured");

      const badLimit = await fetch(`http://127.0.0.1:${port}/users?limit=abc`);
      expect(badLimit.status).toBe(400);
      const tooBig = await fetch(`http://127.0.0.1:${port}/users?limit=101`);
      expect(tooBig.status).toBe(400);

      const postWithoutRepo = await fetch(`http://127.0.0.1:${port}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      expect(postWithoutRepo.status).toBe(501);
    } finally {
      const exitPromise = waitForProcessExit(child);
      child.kill("SIGTERM");
      await exitPromise;
    }
  });

  it("R-crud-06: repository findAll takes ListQuery", async () => {
    const repo = readFileSync(join(dir, "src/users/users.repository.ts"), "utf8");
    expect(repo).toContain("findAll(query: ListQuery)");
  });

  it("R-crud-02: wired repository returns 400 for unknown create fields and 404 for missing id", async () => {
    wireUsersFakeRepository(dir);
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
        body: '{"unexpected":true}',
      });
      expect(bad.status).toBe(400);

      const missing = await fetch(`http://127.0.0.1:${port}/users/does-not-exist`);
      expect(missing.status).toBe(404);
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

  it("R-middleware-04: middleware without --global does not touch app.ts", async () => {
    const before = await import("node:fs/promises").then((fs) => fs.readFile(join(dir, "src/app.ts"), "utf8"));
    const r = await runChisel(["g", "middleware", "local-only"], dir);
    expect(r.code).toBe(0);
    const after = await import("node:fs/promises").then((fs) => fs.readFile(join(dir, "src/app.ts"), "utf8"));
    expect(after).toBe(before);
    expect(after).not.toContain("localOnlyMiddleware");
  });

  it("R-middleware-02: middleware registration is idempotent", async () => {
    await runChisel(["g", "middleware", "auth", "--global"], dir);
    const second = await runChisel(["g", "middleware", "auth", "--global"], dir);
    expect(second.code).not.toBe(0);
    const app = await import("node:fs/promises").then((fs) => fs.readFile(join(dir, "src/app.ts"), "utf8"));
    expect(app.match(/authMiddleware/g)?.length).toBeLessThanOrEqual(3);
  });

});
