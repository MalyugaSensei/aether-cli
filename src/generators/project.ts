import { basename } from "node:path";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { Generator } from "./types.js";

export interface InitOptions {
  force?: boolean;
  projectName?: string;
}

const INIT_MARKERS = ["package.json", "src/app.ts", "src/main.ts"];

export const projectGenerator: Generator<InitOptions & { targetRoot: string }> = {
  name: "project",
  async plan(ctx, options) {
    const root = options.targetRoot;
    const hasExisting = INIT_MARKERS.some((m) => pathExists(root, m));
    if (hasExisting && !options.force) {
      throw new Error(
        "Directory already contains a project. Use --force to overwrite scaffold files.",
      );
    }

    const projectName = options.projectName ?? basename(root) ?? "app";
    const data = { projectName };

    const files: Array<{ rel: string; template: string }> = [
      { rel: "package.json", template: "init/package.json.ejs" },
      { rel: "tsconfig.json", template: "init/tsconfig.json.ejs" },
      { rel: ".gitignore", template: "init/gitignore.ejs" },
      { rel: "chisel.config.json", template: "init/chisel.config.json.ejs" },
      { rel: "src/main.ts", template: "init/src-main.ts.ejs" },
      { rel: "src/app.ts", template: "init/src-app.ts.ejs" },
      { rel: "src/app/server.ts", template: "init/src-app-server.ts.ejs" },
      { rel: "src/app/router.ts", template: "init/src-app-router.ts.ejs" },
      { rel: "src/app/http.ts", template: "init/src-app-http.ts.ejs" },
      { rel: "src/app/middleware/types.ts", template: "init/src-app-middleware-types.ts.ejs" },
      {
        rel: "src/app/middleware/request-logger.ts",
        template: "init/src-app-middleware-request-logger.ts.ejs",
      },
      { rel: "src/health/health.routes.ts", template: "init/src-health-health.routes.ts.ejs" },
    ];

    const ops: FileOp[] = [];
    for (const f of files) {
      const contents = await renderTemplate(f.template, data);
      ops.push({ kind: "create", path: f.rel, contents });
    }
    return ops;
  },
};
