import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import { ChiselError } from "../core/errors.js";
import type { ProjectContext } from "../core/project.js";
import { renderTemplate } from "../core/render.js";
import {
  importPathFromAppEntry,
  importPathFromComposition,
  middlewareFileRel,
  resourceDirRel,
  resourceFileRel,
  compositionRel,
} from "../core/paths.js";
import { addNamedImportIfMissing, appendModuleRoutesSpreadIfMissing } from "../core/ast.js";
import type { Generator } from "./types.js";
import {
  buildResourceContext,
  moduleFactoryName,
  type ResourceField,
} from "./resource-context.js";
import { planResourceTypes } from "./resource-types.js";
import { planRepository } from "./repository.js";
import { planService } from "./service.js";
import { planController } from "./controller.js";
import { planRoutes } from "./routes.js";
import { planValidate } from "./validate.js";
import { planModule } from "./module.js";
import { planResourceTests } from "./resource-tests.js";

export interface ResourceOptions {
  name: string;
  crud?: boolean;
  singular?: string;
  fields?: ResourceField[];
  force?: boolean;
  tests?: boolean;
}

export async function planResourceFiles(
  project: ProjectContext,
  tpl: ReturnType<typeof buildResourceContext>,
): Promise<FileOp[]> {
  const ops: FileOp[] = [await planResourceTypes(project, tpl)];
  const validateOp = await planValidate(project, tpl);
  if (validateOp) {
    ops.push(validateOp);
  }
  ops.push(
    await planRepository(project, tpl),
    await planService(project, tpl),
    await planController(project, tpl),
    await planRoutes(project, tpl),
    await planModule(project, tpl),
  );
  return ops;
}

export function planCompositionRegistration(
  ctx: ProjectContext,
  tpl: ReturnType<typeof buildResourceContext>,
): FileOp {
  const factory = moduleFactoryName(tpl.entityPascal);
  const moduleImport = importPathFromComposition(ctx, tpl.resourceKebab, `${tpl.resourceKebab}.module`);
  const compRel = compositionRel(ctx);
  const callArgs = tpl.crud ? "{}" : "";

  return {
    kind: "modify",
    path: compRel,
    edit(sf) {
      addNamedImportIfMissing(sf, moduleImport, [factory]);
      appendModuleRoutesSpreadIfMissing(sf, factory, callArgs);
    },
  };
}

/** @deprecated Use planCompositionRegistration */
export function planAppRouteRegistration(
  ctx: ProjectContext,
  tpl: ReturnType<typeof buildResourceContext>,
): FileOp {
  return planCompositionRegistration(ctx, tpl);
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
    const dirRel = resourceDirRel(ctx, tpl.resourceKebab);

    if (pathExists(ctx.root, dirRel) && !options.force) {
      if (options.tests) {
        const validateRel = resourceFileRel(ctx, tpl.resourceKebab, "validate");
        if (!pathExists(ctx.root, validateRel)) {
          throw new ChiselError(
            "VALIDATION",
            `Cannot generate tests: ${dirRel} is not a CRUD resource (missing validate).`,
          );
        }
        const crudTpl = buildResourceContext(
          options.name,
          true,
          options.singular,
          options.fields,
        );
        return planResourceTests(ctx, crudTpl);
      }
      throw new ChiselError(
        "ALREADY_EXISTS",
        `Resource directory already exists: ${dirRel}. Use --force to overwrite.`,
      );
    }

    const ops: FileOp[] = await planResourceFiles(ctx, tpl);
    ops.push(planCompositionRegistration(ctx, tpl));
    if (options.tests) {
      ops.push(...(await planResourceTests(ctx, tpl)));
    }
    return ops;
  },
};

export { resourceFileRel, importPathFromAppEntry };
