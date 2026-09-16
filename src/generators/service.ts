import type { FileOp } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import { resourceFileRel } from "../core/paths.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planService(
  project: ProjectContext,
  ctx: ResourceTemplateContext,
): Promise<FileOp> {
  const rel = resourceFileRel(project, ctx.resourceKebab, "service");
  const contents = await renderTemplate("resource/service.ts.eta", ctx);
  return { kind: "create", path: rel, contents };
}
