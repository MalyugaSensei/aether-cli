import type { FileOp } from "../core/plan.js";
import { RESOURCE_TEMPLATE, type ResourceLayer } from "../core/constants.js";
import { resourceFileRel } from "../core/paths.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planResourceLayer(
  project: ProjectContext,
  ctx: ResourceTemplateContext,
  layer: ResourceLayer,
): Promise<FileOp> {
  const rel = resourceFileRel(project, ctx.resourceKebab, layer);
  const contents = await renderTemplate(RESOURCE_TEMPLATE[layer], ctx);
  return { kind: "create", path: rel, contents };
}
