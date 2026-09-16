import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const tsxCli = join(cliRoot, "node_modules/tsx/dist/cli.mjs");

function readConfigPort(cwd: string, env: NodeJS.ProcessEnv): number {
  const child = spawnSync(
    process.execPath,
    [
      tsxCli,
      "-e",
      `import { config } from "./src/app/config"; process.stdout.write(String(config.port));`,
    ],
    { cwd, env, encoding: "utf8" },
  );
  if (child.status !== 0) {
    throw new Error(child.stderr || child.stdout || "failed to load config");
  }
  return Number(child.stdout.trim());
}

describe("init env config", () => {
  it("R-init-10: loadConfig reads PORT from .env when not set in process.env", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-env-file-"));
    const r = await runChisel(["init"], dir);
    expect(r.code).toBe(0);

    writeFileSync(join(dir, ".env"), "PORT=45671\nHOST=127.0.0.1\nNODE_ENV=development\n");

    const env = { ...process.env };
    delete env.PORT;
    delete env.HOST;

    expect(readConfigPort(dir, env)).toBe(45671);
  });

  it("R-init-10: process.env wins over .env file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-env-override-"));
    await runChisel(["init"], dir);

    writeFileSync(join(dir, ".env"), "PORT=45672\nHOST=127.0.0.1\nNODE_ENV=development\n");

    const env = { ...process.env, PORT: "45673", HOST: "127.0.0.1" };
    expect(readConfigPort(dir, env)).toBe(45673);
  });

  it("R-init-11: init --force does not overwrite existing .env", async () => {
    const dir = mkdtempSync(join(tmpdir(), "chisel-env-force-"));
    writeFileSync(join(dir, "package.json"), "{}");
    writeFileSync(join(dir, ".env"), "SECRET=keep-me\nPORT=3999\n");

    const r = await runChisel(["init", "--force"], dir);
    expect(r.code).toBe(0);

    const envContents = readFileSync(join(dir, ".env"), "utf8");
    expect(envContents).toContain("SECRET=keep-me");
    expect(envContents).toContain("PORT=3999");
    expect(envContents).not.toContain("SHUTDOWN_GRACE_MS");
  });
});
