import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import { ErrorCode, ChiselError } from "../core/errors.js";
import { GENERATOR, RESOURCE_LAYER } from "../core/constants.js";
import type { ProjectContext } from "../core/project.js";
import {
  importPathFromAppEntry,
  resourceDirRel,
  resourceFileRel,
  compositionRel,
  importPathFromComposition,
} from "../core/paths.js";
import { addNamedImportIfMissing, appendModuleRoutesSpreadIfMissing } from "../core/ast.js";
import type { Generator } from "./types.js";
import {
  buildResourceContext,
  moduleFactoryName,
  type ResourceField,
} from "./resource-context.js";
import { planResourceLayer } from "./resource-file.js";
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
  const ops: FileOp[] = [await planResourceLayer(project, tpl, RESOURCE_LAYER.types)];
  if (tpl.crud) {
    ops.push(await planResourceLayer(project, tpl, RESOURCE_LAYER.validate));
  }
  ops.push(
    await planResourceLayer(project, tpl, RESOURCE_LAYER.repository),
    await planResourceLayer(project, tpl, RESOURCE_LAYER.service),
    await planResourceLayer(project, tpl, RESOURCE_LAYER.controller),
    await planResourceLayer(project, tpl, RESOURCE_LAYER.routes),
    await planResourceLayer(project, tpl, RESOURCE_LAYER.module),
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
  name: GENERATOR.resource,
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
        const validateRel = resourceFileRel(ctx, tpl.resourceKebab, RESOURCE_LAYER.validate);
        if (!pathExists(ctx.root, validateRel)) {
          throw new ChiselError(
            ErrorCode.VALIDATION,
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
        ErrorCode.ALREADY_EXISTS,
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
