import { commitPlan } from "../core/plan.js";
import { createProjectContext } from "../core/project.js";
import { GENERATOR, type GeneratorName } from "../core/constants.js";
import { middlewareGenerator } from "../generators/middleware.js";
import { openapiGenerator } from "../generators/openapi.js";
import { resourceGenerator } from "../generators/resource.js";

export async function runGenerate(
  kind: Exclude<GeneratorName, "project">,
  name: string | undefined,
  options: {
    crud?: boolean;
    singular?: string;
    tests?: boolean;
    specPath?: string;
    strict?: boolean;
    only?: string[];
    force?: boolean;
    global?: boolean;
    dryRun?: boolean;
    json?: boolean;
    diff?: boolean;
  },
): Promise<void> {
  const ctx = createProjectContext(process.cwd());

  let ops;
  if (kind === GENERATOR.middleware) {
    if (!name) throw new Error("Middleware name is required.");
    ops = await middlewareGenerator.plan(ctx, { name, force: options.force, global: options.global });
  } else if (kind === GENERATOR.openapi) {
    if (!options.specPath) throw new Error("OpenAPI spec path is required.");
    ops = await openapiGenerator.plan(ctx, {
      specPath: options.specPath,
      force: options.force,
      strict: options.strict,
      only: options.only,
    });
  } else {
    if (!name) throw new Error("Resource name is required.");
    ops = await resourceGenerator.plan(ctx, {
      name,
      crud: options.crud,
      singular: options.singular,
      tests: options.tests,
      force: options.force,
    });
  }

  await commitPlan(ctx.root, ops, {
    dryRun: options.dryRun,
    force: options.force,
    json: options.json,
    showDiff: options.diff,
  });
  if (!options.dryRun && !options.json) {
    if (kind === GENERATOR.openapi) {
      console.log(`Generated from OpenAPI "${options.specPath}"`);
    } else {
      console.log(`Generated ${kind} "${name}"`);
    }
  }
}
