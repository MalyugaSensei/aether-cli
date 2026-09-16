import { join } from "node:path";
import type { FileOp } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planValidate(ctx: ResourceTemplateContext): Promise<FileOp | undefined> {
  if (!ctx.crud) {
    return undefined;
  }
  const rel = join("src", ctx.resourceKebab, `${ctx.resourceKebab}.validate.ts`);
  const contents = await renderTemplate("resource/validate.ts.eta", ctx);
  return { kind: "create", path: rel, contents };
}
