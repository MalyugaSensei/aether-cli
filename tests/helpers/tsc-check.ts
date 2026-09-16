import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function tscBin(): string {
  const bin = join(cliRoot, "node_modules/typescript/bin/tsc");
  if (!existsSync(bin)) {
    throw new Error("typescript bin not found; run npm install");
  }
  return bin;
}

/** Run `tsc --noEmit` on a generated project (uses Chisel's TypeScript install). */
export function tscCheck(projectDir: string, typeRoots?: string[]): string[] {
  const args = ["--noEmit", "-p", join(projectDir, "tsconfig.json")];
  if (typeRoots?.length) {
    for (const root of typeRoots) {
      args.push("--typeRoots", root);
    }
  }

  const result = spawnSync(process.execPath, [tscBin(), ...args], {
    cwd: projectDir,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status === 0) {
    return [];
  }
  return out ? out.split("\n") : [`tsc exited with code ${result.status ?? 1}`];
}
