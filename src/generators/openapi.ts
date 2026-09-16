import { resolve } from "node:path";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import { resourceDirRel } from "../core/paths.js";
import { ChiselError, ErrorCode } from "../core/errors.js";
import { GENERATOR } from "../core/constants.js";
import { extractResources } from "../openapi/extract-resources.js";
import { loadOpenApiSpec } from "../openapi/load-spec.js";
import type { Generator } from "./types.js";
import { buildResourceContext } from "./resource-context.js";
import { planCompositionRegistration, planResourceFiles } from "./resource.js";

export interface OpenApiOptions {
  specPath: string;
  force?: boolean;
  strict?: boolean;
  only?: string[];
}

export const openapiGenerator: Generator<OpenApiOptions> = {
  name: GENERATOR.openapi,
  async plan(ctx, options) {
    const absSpec = resolve(ctx.root, options.specPath);
    const doc = loadOpenApiSpec(absSpec);
    const { resources, skipped } = extractResources(doc, {
      strict: options.strict,
      only: options.only,
    });

    if (resources.length === 0) {
      throw new ChiselError(
        ErrorCode.VALIDATION,
        "No REST collections found. Expected /{resource} with POST JSON body and /{resource}/{id}.",
      );
    }

    for (const skip of skipped) {
      console.warn(`openapi: skip ${skip.path} (${skip.reason})`);
    }

    const ops: FileOp[] = [];

    for (const resource of resources) {
      const dirRel = resourceDirRel(ctx, resource.name);
      if (pathExists(ctx.root, dirRel) && !options.force) {
        throw new ChiselError(
          ErrorCode.ALREADY_EXISTS,
          `Resource directory already exists: ${dirRel}. Use --force to overwrite.`,
        );
      }

      const tpl = buildResourceContext(
        resource.name,
        true,
        undefined,
        resource.fields,
        resource.routePrefix,
      );
      ops.push(...(await planResourceFiles(ctx, tpl)));
    }

    for (const resource of resources) {
      const tpl = buildResourceContext(
        resource.name,
        true,
        undefined,
        resource.fields,
        resource.routePrefix,
      );
      ops.push(planCompositionRegistration(ctx, tpl));
    }

    return ops;
  },
};
