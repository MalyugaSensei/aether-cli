import type { FileOp } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import { resourceFileRel } from "../core/paths.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planRoutes(
  project: ProjectContext,
  ctx: ResourceTemplateContext,
): Promise<FileOp> {
  const rel = resourceFileRel(project, ctx.resourceKebab, "routes");
  const contents = await renderTemplate("resource/routes.ts.eta", ctx);
  return { kind: "create", path: rel, contents };
}
