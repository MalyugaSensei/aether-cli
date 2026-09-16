import { relative } from "node:path";
import { addNamedImportIfMissing, appendToArrayLiteralIfMissing } from "../core/ast.js";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import {
  importPathFromAppEntry,
  middlewareFileRel,
} from "../core/paths.js";
import {
  middlewareExportName,
  middlewareFileName,
  validateResourceName,
} from "../core/naming.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import type { Generator } from "./types.js";

export interface MiddlewareOptions {
  name: string;
  force?: boolean;
  global?: boolean;
}

export const middlewareGenerator: Generator<MiddlewareOptions> = {
  name: "middleware",
  async plan(ctx, options) {
    const kebab = middlewareFileName(options.name);
    validateResourceName(kebab);
    const exportName = middlewareExportName(kebab);
    const relPath = middlewareFileRel(ctx, kebab);

    if (pathExists(ctx.root, relPath) && !options.force) {
      throw new Error(`Middleware already exists: ${relPath}. Use --force to overwrite.`);
    }

    const contents = await renderTemplate("middleware/middleware.ts.eta", {
      name: kebab,
      exportName,
    });

    const appRel = relative(ctx.root, ctx.appEntryPath).split("\\").join("/");
    const importPath = importPathFromAppEntry(ctx, middlewareFileRel(ctx, kebab).replace(/\.ts$/, ""));

    const ops: FileOp[] = [{ kind: "create", path: relPath, contents }];

    if (options.global) {
      ops.push({
        kind: "modify",
        path: appRel,
        edit(sf) {
          addNamedImportIfMissing(sf, importPath, [exportName]);
          appendToArrayLiteralIfMissing(sf, "middleware", exportName, false);
        },
      });
    }

    return ops;
  },
};

export function middlewarePlan(ctx: ProjectContext, options: MiddlewareOptions) {
  return middlewareGenerator.plan(ctx, options);
}
