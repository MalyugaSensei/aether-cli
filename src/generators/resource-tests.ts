import { join } from "node:path";
import type { FileOp } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planResourceTests(
  project: ProjectContext,
  ctx: ResourceTemplateContext,
): Promise<FileOp[]> {
  if (!ctx.crud) {
    return [];
  }
  const rel = join("tests", `${ctx.resourceKebab}.repository.fake.ts`);
  const contents = await renderTemplate("resource/repository.fake.ts.eta", ctx);
  const testRel = join("tests", `${ctx.resourceKebab}.module.test.ts`);
  const testContents = await renderTemplate("resource/module.test.ts.eta", ctx);
  return [
    { kind: "create", path: rel, contents },
    { kind: "create", path: testRel, contents: testContents },
  ];
}
