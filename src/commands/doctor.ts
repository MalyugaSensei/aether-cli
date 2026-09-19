import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createProjectContext } from "../core/project.js";
import {
  CONFIG_FILE,
  DIST_DIR,
  EXIT_FAIL,
  EXIT_OK,
  MIN_NODE_MAJOR,
  TEMPLATE_INIT_DIR,
  TEMPLATES_DIRNAME,
} from "../core/constants.js";

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
    ok: nodeMajor >= MIN_NODE_MAJOR,
    message:
      nodeMajor >= MIN_NODE_MAJOR
        ? `Node ${process.version}`
        : `Node ${process.version} is below engines (>=${MIN_NODE_MAJOR})`,
  });

  try {
    createProjectContext(cwd);
    checks.push({ id: "project", ok: true, message: "Aether project context loads" });
  } catch (err) {
    checks.push({
      id: "project",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const templatesDist = join(cliRoot, DIST_DIR, TEMPLATES_DIRNAME, TEMPLATE_INIT_DIR);
  checks.push({
    id: "templates",
    ok: existsSync(templatesDist),
    message: existsSync(templatesDist)
      ? `Packaged templates present (${DIST_DIR}/${TEMPLATES_DIRNAME})`
      : `Run npm run build to copy templates into ${DIST_DIR}/`,
  });

  const configPath = join(cwd, CONFIG_FILE);
  if (existsSync(configPath)) {
    checks.push({ id: "config", ok: true, message: `${CONFIG_FILE} found` });
  } else {
    checks.push({
      id: "config",
      ok: true,
      message: `${CONFIG_FILE} missing (defaults apply after init)`,
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
  return ok ? EXIT_OK : EXIT_FAIL;
}
