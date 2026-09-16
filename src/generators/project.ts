import { basename } from "node:path";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { Generator } from "./types.js";
import {
  APP_DIR,
  CONFIG_FILE,
  CONFIG_VERSION,
  DEFAULT_APP_ENTRY,
  DEFAULT_COMPOSITION,
  DEFAULT_MAIN,
  DEFAULT_SRC_DIR,
  ENV_EXAMPLE_FILE,
  ENV_FILE,
  GENERATOR,
  GITIGNORE,
  HEALTH_DIR,
  MIDDLEWARE_DIR,
  PACKAGE_JSON,
  TSCONFIG_JSON,
} from "../core/constants.js";

export interface InitOptions {
  force?: boolean;
  projectName?: string;
}

const INIT_MARKERS = [PACKAGE_JSON, DEFAULT_APP_ENTRY, DEFAULT_MAIN];

const APP_REL = `${DEFAULT_SRC_DIR}/${APP_DIR}`;
const MIDDLEWARE_REL = `${APP_REL}/${MIDDLEWARE_DIR}`;

const INIT_FILES: Array<{ rel: string; template: string }> = [
  { rel: PACKAGE_JSON, template: "init/package.json.eta" },
  { rel: TSCONFIG_JSON, template: "init/tsconfig.json.eta" },
  { rel: GITIGNORE, template: "init/gitignore.eta" },
  { rel: CONFIG_FILE, template: "init/aether.config.json.eta" },
  { rel: ENV_EXAMPLE_FILE, template: "init/env.example.eta" },
  { rel: DEFAULT_MAIN, template: "init/src-main.ts.eta" },
  { rel: DEFAULT_COMPOSITION, template: "init/src-app-composition.ts.eta" },
  { rel: DEFAULT_APP_ENTRY, template: "init/src-app.ts.eta" },
  { rel: `${APP_REL}/config.ts`, template: "init/src-app-config.ts.eta" },
  { rel: `${APP_REL}/server.ts`, template: "init/src-app-server.ts.eta" },
  { rel: `${APP_REL}/router.ts`, template: "init/src-app-router.ts.eta" },
  { rel: `${APP_REL}/http.ts`, template: "init/src-app-http.ts.eta" },
  { rel: `${APP_REL}/logger.ts`, template: "init/src-app-logger.ts.eta" },
  { rel: `${MIDDLEWARE_REL}/types.ts`, template: "init/src-app-middleware-types.ts.eta" },
  {
    rel: `${MIDDLEWARE_REL}/request-logger.ts`,
    template: "init/src-app-middleware-request-logger.ts.eta",
  },
  {
    rel: `${MIDDLEWARE_REL}/error-handler.ts`,
    template: "init/src-app-middleware-error-handler.ts.eta",
  },
  {
    rel: `${DEFAULT_SRC_DIR}/${HEALTH_DIR}/health.routes.ts`,
    template: "init/src-health-health.routes.ts.eta",
  },
];

export const projectGenerator: Generator<InitOptions & { targetRoot: string }> = {
  name: GENERATOR.project,
  async plan(ctx, options) {
    const root = options.targetRoot;
    const hasExisting = INIT_MARKERS.some((m) => pathExists(root, m));
    if (hasExisting && !options.force) {
      throw new Error(
        "Directory already contains a project. Use --force to overwrite scaffold files.",
      );
    }

    const projectName = options.projectName ?? basename(root) ?? "app";
    const data = {
      projectName,
      configVersion: CONFIG_VERSION,
      srcDir: DEFAULT_SRC_DIR,
      appEntry: DEFAULT_APP_ENTRY,
    };

    const ops: FileOp[] = [];
    for (const f of INIT_FILES) {
      const contents = await renderTemplate(f.template, data);
      ops.push({ kind: "create", path: f.rel, contents });
    }
    if (!pathExists(root, ENV_FILE)) {
      const envContents = await renderTemplate("init/env.eta", data);
      ops.push({ kind: "create", path: ENV_FILE, contents: envContents });
    }
    return ops;
  },
};
