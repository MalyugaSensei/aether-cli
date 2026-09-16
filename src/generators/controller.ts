import { join } from "node:path";
import type { FileOp } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planController(ctx: ResourceTemplateContext): Promise<FileOp> {
  const rel = join("src", ctx.resourceKebab, `${ctx.resourceKebab}.controller.ts`);
  const contents = await renderTemplate("resource/controller.ts.eta", ctx);
  return { kind: "create", path: rel, contents };
}
