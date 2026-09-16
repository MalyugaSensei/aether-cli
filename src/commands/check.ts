import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createProjectContext, loadConfig } from "../core/project.js";
import { compositionRel } from "../core/paths.js";
import { pathExists } from "../core/plan.js";

export async function runCheck(cwd: string, options: { json?: boolean }): Promise<number> {
  const issues: string[] = [];

  try {
    loadConfig(cwd);
  } catch (err) {
    issues.push(err instanceof Error ? err.message : String(err));
  }

  try {
    const ctx = createProjectContext(cwd);
    const compPath = compositionRel(ctx);
    if (!pathExists(cwd, compPath)) {
      issues.push(`Missing ${compPath}`);
    } else {
      const src = readFileSync(join(cwd, compPath), "utf8");
      if (!src.includes("function buildAppRoutes")) {
        issues.push(`${compPath} must export buildAppRoutes()`);
      }
    }
  } catch (err) {
    issues.push(err instanceof Error ? err.message : String(err));
  }

  const ok = issues.length === 0;
  if (options.json) {
    console.log(JSON.stringify({ ok, issues }, null, 2));
  } else if (ok) {
    console.log("ok: project structure checks passed");
  } else {
    for (const issue of issues) {
      console.error(issue);
    }
  }
  return ok ? 0 : 1;
}
