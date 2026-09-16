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
      { rel: "package.json", template: "init/package.json.eta" },
      { rel: "tsconfig.json", template: "init/tsconfig.json.eta" },
      { rel: ".gitignore", template: "init/gitignore.eta" },
      { rel: "chisel.config.json", template: "init/chisel.config.json.eta" },
      { rel: ".env.example", template: "init/env.example.eta" },
      { rel: "src/main.ts", template: "init/src-main.ts.eta" },
      { rel: "src/app.ts", template: "init/src-app.ts.eta" },
      { rel: "src/app/config.ts", template: "init/src-app-config.ts.eta" },
      { rel: "src/app/server.ts", template: "init/src-app-server.ts.eta" },
      { rel: "src/app/router.ts", template: "init/src-app-router.ts.eta" },
      { rel: "src/app/http.ts", template: "init/src-app-http.ts.eta" },
      { rel: "src/app/logger.ts", template: "init/src-app-logger.ts.eta" },
      { rel: "src/app/middleware/types.ts", template: "init/src-app-middleware-types.ts.eta" },
      {
        rel: "src/app/middleware/request-logger.ts",
        template: "init/src-app-middleware-request-logger.ts.eta",
      },
      {
        rel: "src/app/middleware/error-handler.ts",
        template: "init/src-app-middleware-error-handler.ts.eta",
      },
      { rel: "src/health/health.routes.ts", template: "init/src-health-health.routes.ts.eta" },
    ];

    const ops: FileOp[] = [];
    for (const f of files) {
      const contents = await renderTemplate(f.template, data);
      ops.push({ kind: "create", path: f.rel, contents });
    }
    if (!pathExists(root, ".env")) {
      const envContents = await renderTemplate("init/env.eta", data);
      ops.push({ kind: "create", path: ".env", contents: envContents });
    }
    return ops;
  },
};
