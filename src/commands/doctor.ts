import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createProjectContext } from "../core/project.js";

export interface DoctorCheck {
  id: string;
  ok: boolean;
  message: string;
}

export function runDoctorChecks(cwd: string): DoctorCheck[] {
  const checks: DoctorCheck[] = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push({
    id: "node",
    ok: nodeMajor >= 20,
    message: nodeMajor >= 20 ? `Node ${process.version}` : `Node ${process.version} is below engines (>=20)`,
  });

  try {
    createProjectContext(cwd);
    checks.push({ id: "project", ok: true, message: "Chisel project context loads" });
  } catch (err) {
    checks.push({
      id: "project",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const templatesDist = join(cliRoot, "dist", "templates", "init");
  checks.push({
    id: "templates",
    ok: existsSync(templatesDist),
    message: existsSync(templatesDist)
      ? "Packaged templates present (dist/templates)"
      : "Run npm run build to copy templates into dist/",
  });

  const configPath = join(cwd, "chisel.config.json");
  if (existsSync(configPath)) {
    checks.push({ id: "config", ok: true, message: "chisel.config.json found" });
  } else {
    checks.push({
      id: "config",
      ok: true,
      message: "chisel.config.json missing (defaults apply after init)",
    });
  }

  return checks;
}

export async function runDoctor(cwd: string, json?: boolean): Promise<number> {
  const checks = runDoctorChecks(cwd);
  const ok = checks.every((c) => c.ok);
  if (json) {
    console.log(JSON.stringify({ ok, checks }, null, 2));
  } else {
    for (const c of checks) {
      console.log(`${c.ok ? "ok" : "fail"} ${c.id}: ${c.message}`);
    }
  }
  return ok ? 0 : 1;
}
