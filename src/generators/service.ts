import { join } from "node:path";
import type { FileOp } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planService(ctx: ResourceTemplateContext): Promise<FileOp> {
  const rel = join("src", ctx.resourceKebab, `${ctx.resourceKebab}.service.ts`);
  const contents = await renderTemplate("resource/service.ts.eta", ctx);
  return { kind: "create", path: rel, contents };
}
