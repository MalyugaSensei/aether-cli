import type { FileOp } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import { resourceFileRel } from "../core/paths.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planRepository(
  project: ProjectContext,
  ctx: ResourceTemplateContext,
): Promise<FileOp> {
  const rel = resourceFileRel(project, ctx.resourceKebab, "repository");
  const contents = await renderTemplate("resource/repository.ts.eta", ctx);
  return { kind: "create", path: rel, contents };
}
