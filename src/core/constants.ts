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

export const JSON_MIME = "application/json" as const;
export const OPENAPI_VERSION_PREFIX = "3.";
export const OPENAPI_SCHEMA_REF_PREFIX = "#/components/schemas/";

export const OPENAPI_HTTP_METHOD = {
  post: "post",
  patch: "patch",
  put: "put",
} as const;

export type OpenApiHttpMethod = (typeof OPENAPI_HTTP_METHOD)[keyof typeof OPENAPI_HTTP_METHOD];

export const OPENAPI_SCHEMA_TYPE = {
  string: "string",
  boolean: "boolean",
  number: "number",
  integer: "integer",
} as const;

export const TS_SCALAR_TYPE = {
  string: "string",
  number: "number",
  boolean: "boolean",
} as const;

export type TsScalarType = (typeof TS_SCALAR_TYPE)[keyof typeof TS_SCALAR_TYPE];

export const ENTITY_ID_FIELD = "id";

export const DEFAULT_PROJECT_NAME = "app";

export const AETHER_TMP_SUFFIX = ".aether.tmp";

export const TEMPLATE_INIT_DIR = "init";

export const INIT_TEMPLATE = {
  packageJson: `${TEMPLATE_INIT_DIR}/package.json.eta`,
  tsconfig: `${TEMPLATE_INIT_DIR}/tsconfig.json.eta`,
  gitignore: `${TEMPLATE_INIT_DIR}/gitignore.eta`,
  aetherConfig: `${TEMPLATE_INIT_DIR}/aether.config.json.eta`,
  envExample: `${TEMPLATE_INIT_DIR}/env.example.eta`,
  env: `${TEMPLATE_INIT_DIR}/env.eta`,
  main: `${TEMPLATE_INIT_DIR}/src-main.ts.eta`,
  composition: `${TEMPLATE_INIT_DIR}/src-app-composition.ts.eta`,
  app: `${TEMPLATE_INIT_DIR}/src-app.ts.eta`,
  appConfig: `${TEMPLATE_INIT_DIR}/src-app-config.ts.eta`,
  appServer: `${TEMPLATE_INIT_DIR}/src-app-server.ts.eta`,
  appRouter: `${TEMPLATE_INIT_DIR}/src-app-router.ts.eta`,
  appHttp: `${TEMPLATE_INIT_DIR}/src-app-http.ts.eta`,
  appList: `${TEMPLATE_INIT_DIR}/src-app-list.ts.eta`,
  appLogger: `${TEMPLATE_INIT_DIR}/src-app-logger.ts.eta`,
  middlewareTypes: `${TEMPLATE_INIT_DIR}/src-app-middleware-types.ts.eta`,
  middlewareRequestLogger: `${TEMPLATE_INIT_DIR}/src-app-middleware-request-logger.ts.eta`,
  middlewareErrorHandler: `${TEMPLATE_INIT_DIR}/src-app-middleware-error-handler.ts.eta`,
  middlewareCors: `${TEMPLATE_INIT_DIR}/src-app-middleware-cors.ts.eta`,
  middlewareBodyLimit: `${TEMPLATE_INIT_DIR}/src-app-middleware-body-limit.ts.eta`,
  middlewareBearerAuth: `${TEMPLATE_INIT_DIR}/src-app-middleware-bearer-auth.ts.eta`,
  healthRoutes: `${TEMPLATE_INIT_DIR}/src-health-health.routes.ts.eta`,
} as const;

export const APP_SCAFFOLD = {
  config: "config.ts",
  server: "server.ts",
  router: "router.ts",
  http: "http.ts",
  list: "list.ts",
  logger: "logger.ts",
} as const;

export const MIDDLEWARE_SCAFFOLD = {
  types: "types.ts",
  requestLogger: "request-logger.ts",
  errorHandler: "error-handler.ts",
  cors: "cors.ts",
  bodyLimit: "body-limit.ts",
  bearerAuth: "bearer-auth.ts",
} as const;

export const HEALTH_ROUTES_BASENAME = "health.routes.ts";

export const RESOURCE_TEST_SUFFIX = {
  repositoryFake: "repository.fake",
  moduleTest: "module.test",
} as const;

export const FILE_OP = {
  create: "create",
  modify: "modify",
} as const;

export type FileOpKind = (typeof FILE_OP)[keyof typeof FILE_OP];

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

export const RESOURCE_PLAN_MODE = {
  full: "full",
  schema: "schema",
} as const;

export type ResourcePlanMode = (typeof RESOURCE_PLAN_MODE)[keyof typeof RESOURCE_PLAN_MODE];

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
