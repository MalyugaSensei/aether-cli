import { join, relative } from "node:path";
import { addNamedImportIfMissing, appendToArrayLiteralIfMissing } from "../core/ast.js";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import type { ProjectContext } from "../core/project.js";
import type { Generator } from "./types.js";
import { buildResourceContext, routesExportName } from "./resource-context.js";
import { planResourceTypes } from "./resource-types.js";
import { planRepository } from "./repository.js";
import { planService } from "./service.js";
import { planController } from "./controller.js";
import { planRoutes } from "./routes.js";

export interface ResourceOptions {
  name: string;
  crud?: boolean;
  singular?: string;
  force?: boolean;
}

export const resourceGenerator: Generator<ResourceOptions> = {
  name: "resource",
  async plan(ctx, options) {
    const tpl = buildResourceContext(options.name, Boolean(options.crud), options.singular);
    const dirRel = join("src", tpl.resourceKebab);

    if (pathExists(ctx.root, dirRel) && !options.force) {
      throw new Error(`Resource directory already exists: ${dirRel}. Use --force to overwrite.`);
    }

    const ops: FileOp[] = [
      await planResourceTypes(tpl),
      await planRepository(tpl),
      await planService(tpl),
      await planController(tpl),
      await planRoutes(tpl),
    ];

    const routesVar = routesExportName(tpl.resourceCamel);
    const importPath = `./${tpl.resourceKebab}/${tpl.resourceKebab}.routes`;
    const appRel = relative(ctx.root, ctx.appEntryPath).split("\\").join("/");

    ops.push({
      kind: "modify",
      path: appRel,
      edit(sf) {
        addNamedImportIfMissing(sf, importPath, [routesVar]);
        appendToArrayLiteralIfMissing(sf, "routes", routesVar, true);
      },
    });

    return ops;
  },
};
