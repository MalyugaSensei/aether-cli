import type { FileOp } from "../core/plan.js";
import type { ProjectContext } from "../core/project.js";

export interface Generator<O = void> {
  name: string;
  plan(ctx: ProjectContext, options: O): Promise<FileOp[]>;
}
