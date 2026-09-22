import { relative } from "node:path";
import {
  addNamedImportIfMissing,
  appendToArrayLiteralIfMissing,
  insertIntoArrayLiteralBeforeIfMissing,
} from "../core/ast.js";
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
import {
  AST_SYMBOL,
  FILE_OP,
  GENERATOR,
  MIDDLEWARE_RECIPE,
  MIDDLEWARE_SCAFFOLD_SYMBOL,
  TEMPLATE,
} from "../core/constants.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import type { Generator } from "./types.js";

export interface MiddlewareOptions {
  name: string;
  force?: boolean;
  global?: boolean;
}

export const middlewareGenerator: Generator<MiddlewareOptions> = {
  name: GENERATOR.middleware,
  async plan(ctx, options) {
    const kebab = middlewareFileName(options.name);
    validateResourceName(kebab);
    const exportName = middlewareExportName(kebab);
    const relPath = middlewareFileRel(ctx, kebab);

    if (pathExists(ctx.root, relPath) && !options.force) {
      throw new Error(`Middleware already exists: ${relPath}. Use --force to overwrite.`);
    }

    const templateKey =
      kebab === MIDDLEWARE_RECIPE.requestId ? TEMPLATE.middlewareRequestId : TEMPLATE.middleware;
    const contents = await renderTemplate(templateKey, {
      name: kebab,
      exportName,
    });

    const appRel = relative(ctx.root, ctx.appEntryPath).split("\\").join("/");
    const importPath = importPathFromAppEntry(ctx, middlewareFileRel(ctx, kebab).replace(/\.ts$/, ""));

    const ops: FileOp[] = [{ kind: FILE_OP.create, path: relPath, contents }];

    if (options.global) {
      ops.push({
        kind: FILE_OP.modify,
        path: appRel,
        edit(sf) {
          addNamedImportIfMissing(sf, importPath, [exportName]);
          if (kebab === MIDDLEWARE_RECIPE.requestId) {
            insertIntoArrayLiteralBeforeIfMissing(
              sf,
              AST_SYMBOL.middlewareArray,
              MIDDLEWARE_SCAFFOLD_SYMBOL.requestLogger,
              exportName,
            );
          } else {
            appendToArrayLiteralIfMissing(sf, AST_SYMBOL.middlewareArray, exportName, false);
          }
        },
      });
    }

    return ops;
  },
};

export function middlewarePlan(ctx: ProjectContext, options: MiddlewareOptions) {
  return middlewareGenerator.plan(ctx, options);
}
