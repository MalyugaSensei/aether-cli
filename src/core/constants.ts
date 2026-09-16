/** Canonical layout and contract values. Do not scatter these literals. */

export const CLI_NAME = "aether";

export const CONFIG_FILE = "aether.config.json";
export const CONFIG_VERSION = 1;
export const PACKAGE_JSON = "package.json";
export const TSCONFIG_JSON = "tsconfig.json";
export const GITIGNORE = ".gitignore";
export const ENV_FILE = ".env";
export const ENV_EXAMPLE_FILE = ".env.example";

export const DEFAULT_SRC_DIR = "src";
export const APP_DIR = "app";
export const MIDDLEWARE_DIR = "middleware";
export const HEALTH_DIR = "health";
export const TESTS_DIR = "tests";
export const DIST_DIR = "dist";
export const TEMPLATES_DIRNAME = "templates";

export const APP_ENTRY_BASENAME = "app.ts";
export const MAIN_BASENAME = "main.ts";
export const COMPOSITION_BASENAME = "composition.ts";

export const DEFAULT_APP_ENTRY = `${DEFAULT_SRC_DIR}/${APP_ENTRY_BASENAME}`;
export const DEFAULT_MAIN = `${DEFAULT_SRC_DIR}/${MAIN_BASENAME}`;
export const DEFAULT_COMPOSITION = `${DEFAULT_SRC_DIR}/${APP_DIR}/${COMPOSITION_BASENAME}`;

export const MIN_NODE_MAJOR = 20;
export const EXIT_OK = 0;
export const EXIT_FAIL = 1;

export const JSON_MIME = "application/json";
export const OPENAPI_VERSION_PREFIX = "3.";
export const OPENAPI_SCHEMA_REF_PREFIX = "#/components/schemas/";

export const GENERATOR = {
  project: "project",
  resource: "resource",
  middleware: "middleware",
  openapi: "openapi",
} as const;

export type GeneratorName = (typeof GENERATOR)[keyof typeof GENERATOR];

export const RESOURCE_LAYER = {
  types: "types",
  validate: "validate",
  repository: "repository",
  service: "service",
  controller: "controller",
  routes: "routes",
  module: "module",
} as const;

export type ResourceLayer = (typeof RESOURCE_LAYER)[keyof typeof RESOURCE_LAYER];

export const RESOURCE_TEMPLATE: Record<ResourceLayer, string> = {
  types: "resource/types.ts.eta",
  validate: "resource/validate.ts.eta",
  repository: "resource/repository.ts.eta",
  service: "resource/service.ts.eta",
  controller: "resource/controller.ts.eta",
  routes: "resource/routes.ts.eta",
  module: "resource/module.ts.eta",
};

export const TEMPLATE = {
  middleware: "middleware/middleware.ts.eta",
  resourceTestsFake: "resource/repository.fake.ts.eta",
  resourceTestsModule: "resource/module.test.ts.eta",
} as const;

export const AST_SYMBOL = {
  buildAppRoutes: "buildAppRoutes",
  middlewareArray: "middleware",
} as const;
