import { commitPlan } from "../core/plan.js";
import { createProjectContext } from "../core/project.js";
import { middlewareGenerator } from "../generators/middleware.js";
import { resourceGenerator } from "../generators/resource.js";

export async function runGenerate(
  kind: "middleware" | "resource",
  name: string,
  options: {
    crud?: boolean;
    singular?: string;
    force?: boolean;
    dryRun?: boolean;
  },
): Promise<void> {
  const ctx = createProjectContext(process.cwd());

  let ops;
  if (kind === "middleware") {
    ops = await middlewareGenerator.plan(ctx, { name, force: options.force });
  } else {
    ops = await resourceGenerator.plan(ctx, {
      name,
      crud: options.crud,
      singular: options.singular,
      force: options.force,
    });
  }

  await commitPlan(ctx.root, ops, { dryRun: options.dryRun, force: options.force });
  if (!options.dryRun) {
    console.log(`Generated ${kind} "${name}"`);
  }
}
