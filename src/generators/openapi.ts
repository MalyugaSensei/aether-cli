import { join, resolve } from "node:path";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import { extractResources } from "../openapi/extract-resources.js";
import { loadOpenApiSpec } from "../openapi/load-spec.js";
import type { Generator } from "./types.js";
import { buildResourceContext } from "./resource-context.js";
import { planAppRouteRegistration, planResourceFiles } from "./resource.js";

export interface OpenApiOptions {
  specPath: string;
  force?: boolean;
}

export const openapiGenerator: Generator<OpenApiOptions> = {
  name: "openapi",
  async plan(ctx, options) {
    const absSpec = resolve(ctx.root, options.specPath);
    const doc = loadOpenApiSpec(absSpec);
    const extracted = extractResources(doc);

    if (extracted.length === 0) {
      throw new Error(
        "No REST collections found. Expected /{resource} with POST JSON body and /{resource}/{id}.",
      );
    }

    const ops: FileOp[] = [];

    for (const resource of extracted) {
      const dirRel = join("src", resource.name);
      if (pathExists(ctx.root, dirRel) && !options.force) {
        throw new Error(`Resource directory already exists: ${dirRel}. Use --force to overwrite.`);
      }

      const tpl = buildResourceContext(resource.name, true, undefined, resource.fields);
      ops.push(...(await planResourceFiles(tpl)));
    }

    for (const resource of extracted) {
      const tpl = buildResourceContext(resource.name, true, undefined, resource.fields);
      ops.push(planAppRouteRegistration(ctx, tpl));
    }

    return ops;
  },
};
