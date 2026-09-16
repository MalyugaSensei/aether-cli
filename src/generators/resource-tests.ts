import { join } from "node:path";
import type { FileOp } from "../core/plan.js";
import { TEMPLATE, TESTS_DIR } from "../core/constants.js";
import { renderTemplate } from "../core/render.js";
import type { ProjectContext } from "../core/project.js";
import type { ResourceTemplateContext } from "./resource-context.js";

export async function planResourceTests(
  _project: ProjectContext,
  ctx: ResourceTemplateContext,
): Promise<FileOp[]> {
  if (!ctx.crud) {
    return [];
  }
  const rel = join(TESTS_DIR, `${ctx.resourceKebab}.repository.fake.ts`);
  const contents = await renderTemplate(TEMPLATE.resourceTestsFake, ctx);
  const testRel = join(TESTS_DIR, `${ctx.resourceKebab}.module.test.ts`);
  const testContents = await renderTemplate(TEMPLATE.resourceTestsModule, ctx);
  return [
    { kind: "create", path: rel, contents },
    { kind: "create", path: testRel, contents: testContents },
  ];
}
