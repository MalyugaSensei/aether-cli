import { basename } from "node:path";
import type { FileOp } from "../core/plan.js";
import { pathExists } from "../core/plan.js";
import { renderTemplate } from "../core/render.js";
import type { Generator } from "./types.js";
import {
  APP_DIR,
  APP_SCAFFOLD,
  CONFIG_FILE,
  CONFIG_VERSION,
  DEFAULT_APP_ENTRY,
  DEFAULT_COMPOSITION,
  DEFAULT_MAIN,
  DEFAULT_PROJECT_NAME,
  DEFAULT_SRC_DIR,
  ENV_EXAMPLE_FILE,
  ENV_FILE,
  FILE_OP,
  GENERATOR,
  GITIGNORE,
  HEALTH_DIR,
  HEALTH_ROUTES_BASENAME,
  INIT_TEMPLATE,
  MIDDLEWARE_DIR,
  MIDDLEWARE_SCAFFOLD,
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
  { rel: PACKAGE_JSON, template: INIT_TEMPLATE.packageJson },
  { rel: TSCONFIG_JSON, template: INIT_TEMPLATE.tsconfig },
  { rel: GITIGNORE, template: INIT_TEMPLATE.gitignore },
  { rel: CONFIG_FILE, template: INIT_TEMPLATE.aetherConfig },
  { rel: ENV_EXAMPLE_FILE, template: INIT_TEMPLATE.envExample },
  { rel: DEFAULT_MAIN, template: INIT_TEMPLATE.main },
  { rel: DEFAULT_COMPOSITION, template: INIT_TEMPLATE.composition },
  { rel: DEFAULT_APP_ENTRY, template: INIT_TEMPLATE.app },
  { rel: `${APP_REL}/${APP_SCAFFOLD.config}`, template: INIT_TEMPLATE.appConfig },
  { rel: `${APP_REL}/${APP_SCAFFOLD.server}`, template: INIT_TEMPLATE.appServer },
  { rel: `${APP_REL}/${APP_SCAFFOLD.router}`, template: INIT_TEMPLATE.appRouter },
  { rel: `${APP_REL}/${APP_SCAFFOLD.http}`, template: INIT_TEMPLATE.appHttp },
  { rel: `${APP_REL}/${APP_SCAFFOLD.list}`, template: INIT_TEMPLATE.appList },
  { rel: `${APP_REL}/${APP_SCAFFOLD.logger}`, template: INIT_TEMPLATE.appLogger },
  { rel: `${MIDDLEWARE_REL}/${MIDDLEWARE_SCAFFOLD.types}`, template: INIT_TEMPLATE.middlewareTypes },
  {
    rel: `${MIDDLEWARE_REL}/${MIDDLEWARE_SCAFFOLD.requestLogger}`,
    template: INIT_TEMPLATE.middlewareRequestLogger,
  },
  {
    rel: `${MIDDLEWARE_REL}/${MIDDLEWARE_SCAFFOLD.errorHandler}`,
    template: INIT_TEMPLATE.middlewareErrorHandler,
  },
  {
    rel: `${MIDDLEWARE_REL}/${MIDDLEWARE_SCAFFOLD.cors}`,
    template: INIT_TEMPLATE.middlewareCors,
  },
  {
    rel: `${MIDDLEWARE_REL}/${MIDDLEWARE_SCAFFOLD.bodyLimit}`,
    template: INIT_TEMPLATE.middlewareBodyLimit,
  },
  {
    rel: `${MIDDLEWARE_REL}/${MIDDLEWARE_SCAFFOLD.bearerAuth}`,
    template: INIT_TEMPLATE.middlewareBearerAuth,
  },
  {
    rel: `${DEFAULT_SRC_DIR}/${HEALTH_DIR}/${HEALTH_ROUTES_BASENAME}`,
    template: INIT_TEMPLATE.healthRoutes,
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

    const projectName = options.projectName ?? basename(root) ?? DEFAULT_PROJECT_NAME;
    const data = {
      projectName,
      configVersion: CONFIG_VERSION,
      srcDir: DEFAULT_SRC_DIR,
      appEntry: DEFAULT_APP_ENTRY,
    };

    const ops: FileOp[] = [];
    for (const f of INIT_FILES) {
      const contents = await renderTemplate(f.template, data);
      ops.push({ kind: FILE_OP.create, path: f.rel, contents });
    }
    if (!pathExists(root, ENV_FILE)) {
      const envContents = await renderTemplate(INIT_TEMPLATE.env, data);
      ops.push({ kind: FILE_OP.create, path: ENV_FILE, contents: envContents });
    }
    return ops;
  },
};
