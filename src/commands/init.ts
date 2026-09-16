import { commitPlan } from "../core/plan.js";
import { projectGenerator } from "../generators/project.js";
import { CONFIG_VERSION, DEFAULT_APP_ENTRY, DEFAULT_SRC_DIR } from "../core/constants.js";

export async function runInit(
  cwd: string,
  options: { force?: boolean; dryRun?: boolean; json?: boolean; diff?: boolean },
): Promise<void> {
  const ctx = {
    root: cwd,
    config: { version: CONFIG_VERSION, srcDir: DEFAULT_SRC_DIR, appEntry: DEFAULT_APP_ENTRY },
    appEntryPath: "",
  };
  const ops = await projectGenerator.plan(ctx, {
    targetRoot: cwd,
    force: options.force,
  });
  await commitPlan(cwd, ops, {
    dryRun: options.dryRun,
    force: options.force,
    json: options.json,
    showDiff: options.diff,
  });
  if (!options.dryRun && !options.json) {
    console.log("Project initialized. Run npm install && npm run dev");
  }
}
