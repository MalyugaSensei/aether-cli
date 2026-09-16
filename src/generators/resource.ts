import { join, relative } from "node:path";
import { addNamedImportIfMissing, appendToArrayLiteralIfMissing } from "../core/ast.js";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import type { ProjectContext } from "../core/project.js";
import type { Generator } from "./types.js";
import {
  buildResourceContext,
  routesExportName,
  type ResourceField,
} from "./resource-context.js";
import { planResourceTypes } from "./resource-types.js";
import { planRepository } from "./repository.js";
import { planService } from "./service.js";
import { planController } from "./controller.js";
import { planRoutes } from "./routes.js";
import { planValidate } from "./validate.js";

export interface ResourceOptions {
  name: string;
  crud?: boolean;
  singular?: string;
  fields?: ResourceField[];
  force?: boolean;
}

export async function planResourceFiles(
  tpl: ReturnType<typeof buildResourceContext>,
): Promise<FileOp[]> {
  const ops: FileOp[] = [await planResourceTypes(tpl)];
  const validateOp = await planValidate(tpl);
  if (validateOp) {
    ops.push(validateOp);
  }
  ops.push(
    await planRepository(tpl),
    await planService(tpl),
    await planController(tpl),
    await planRoutes(tpl),
  );
  return ops;
}

export function planAppRouteRegistration(
  ctx: ProjectContext,
  tpl: ReturnType<typeof buildResourceContext>,
): FileOp {
  const routesVar = routesExportName(tpl.resourceCamel);
  const importPath = `./${tpl.resourceKebab}/${tpl.resourceKebab}.routes`;
  const appRel = relative(ctx.root, ctx.appEntryPath).split("\\").join("/");

  return {
    kind: "modify",
    path: appRel,
    edit(sf) {
      addNamedImportIfMissing(sf, importPath, [routesVar]);
      appendToArrayLiteralIfMissing(sf, "routes", routesVar, true);
    },
  };
}

export const resourceGenerator: Generator<ResourceOptions> = {
  name: "resource",
  async plan(ctx, options) {
    const tpl = buildResourceContext(
      options.name,
      Boolean(options.crud),
      options.singular,
      options.fields,
    );
    const dirRel = join("src", tpl.resourceKebab);

    if (pathExists(ctx.root, dirRel) && !options.force) {
      throw new Error(`Resource directory already exists: ${dirRel}. Use --force to overwrite.`);
    }

    const ops: FileOp[] = await planResourceFiles(tpl);
    ops.push(planAppRouteRegistration(ctx, tpl));
    return ops;
  },
};
