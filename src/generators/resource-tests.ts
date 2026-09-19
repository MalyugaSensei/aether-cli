import { join } from "node:path";
import type { FileOp } from "../core/plan.js";
import { FILE_OP, RESOURCE_TEST_SUFFIX, TEMPLATE, TESTS_DIR } from "../core/constants.js";
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
  const rel = join(TESTS_DIR, `${ctx.resourceKebab}.${RESOURCE_TEST_SUFFIX.repositoryFake}.ts`);
  const contents = await renderTemplate(TEMPLATE.resourceTestsFake, ctx);
  const testRel = join(TESTS_DIR, `${ctx.resourceKebab}.${RESOURCE_TEST_SUFFIX.moduleTest}.ts`);
  const testContents = await renderTemplate(TEMPLATE.resourceTestsModule, ctx);
  return [
    { kind: FILE_OP.create, path: rel, contents },
    { kind: FILE_OP.create, path: testRel, contents: testContents },
  ];
}
