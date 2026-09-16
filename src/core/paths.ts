import { join, relative } from "node:path";
import type { ProjectContext } from "./project.js";

export function resourceDirRel(ctx: ProjectContext, resourceKebab: string): string {
  return join(ctx.config.srcDir, resourceKebab);
}

export function resourceFileRel(ctx: ProjectContext, resourceKebab: string, suffix: string): string {
  return join(resourceDirRel(ctx, resourceKebab), `${resourceKebab}.${suffix}.ts`);
}

export function middlewareFileRel(ctx: ProjectContext, kebab: string): string {
  return join(ctx.config.srcDir, "app", "middleware", `${kebab}.ts`);
}

/** Import path from app entry file to a module under srcDir (no extension). */
export function importPathFromAppEntry(ctx: ProjectContext, targetRelFromRoot: string): string {
  const appDir = join(ctx.root, ctx.config.appEntry).replace(/\\/g, "/");
  const appFolder = appDir.slice(0, appDir.lastIndexOf("/"));
  const targetAbs = join(ctx.root, targetRelFromRoot).replace(/\\/g, "/");
  let rel = relative(appFolder, targetAbs).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel.replace(/\.ts$/, "");
}

export function compositionRel(ctx: ProjectContext): string {
  return join(ctx.config.srcDir, "app", "composition.ts");
}

export function importPathFromComposition(
  ctx: ProjectContext,
  resourceKebab: string,
  fileBase: string,
): string {
  const compDir = join(ctx.root, ctx.config.srcDir, "app");
  const target = join(ctx.root, ctx.config.srcDir, resourceKebab, `${fileBase}.ts`);
  let rel = relative(compDir, target).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel.replace(/\.ts$/, "");
}
