import { describe, expect, it } from "vitest";
import { renderTemplate } from "../../src/core/render.js";

describe("templates", () => {
  it("R-init-02: init package.json has no runtime dependencies", async () => {
    const json = await renderTemplate("init/package.json.eta", { projectName: "demo" });
    const pkg = JSON.parse(json) as {
      dependencies?: Record<string, string>;
      type?: string;
      scripts?: Record<string, string>;
    };
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.type).toBeUndefined();
    expect(pkg.scripts?.dev).toBe("tsx watch src/main.ts");
    expect(pkg.scripts?.build).toBe("tsc");
    expect(pkg.scripts?.test).toBe("node --import tsx --test tests/**/*.test.ts");
  });

  it("R-init-05: init main.ts handles graceful shutdown", async () => {
    const src = await renderTemplate("init/src-main.ts.eta", { projectName: "demo" });
    expect(src).toContain('process.once("SIGINT"');
    expect(src).toContain('process.once("SIGTERM"');
    expect(src).toContain("server.close(");
    expect(src).toContain("closeAllConnections()");
    expect(src).toContain("config.shutdownGraceMs");
    expect(src).not.toContain("process.env.PORT");
  });

  it("R-init-06: init uses logger instead of console in main", async () => {
    const main = await renderTemplate("init/src-main.ts.eta", { projectName: "demo" });
    expect(main).toContain('from "./app/logger"');
    expect(main).toContain("logger.info");
    expect(main).not.toMatch(/console\.log/);

    const requestLogger = await renderTemplate("init/src-app-middleware-request-logger.ts.eta", {
      projectName: "demo",
    });
    expect(requestLogger).toContain("logger.info");
    expect(requestLogger).toContain("requestId");
  });

  it("R-init-07: init app catches request errors", async () => {
    const app = await renderTemplate("init/src-app.ts.eta", { projectName: "demo" });
    expect(app).toContain("handleRequestError");
    expect(app).toContain("catch (err)");
    expect(app).toContain("buildAppRoutes");
  });

  it("R-init-18: init includes health HTTP smoke helper and createApp route override", async () => {
    const app = await renderTemplate("init/src-app.ts.eta", { projectName: "demo" });
    expect(app).toContain("CreateAppOptions");
    expect(app).toContain("options?.routes ?? buildAppRoutes()");

    const healthTest = await renderTemplate("init/tests/health.http.test.ts.eta", {
      projectName: "demo",
    });
    expect(healthTest).toContain("withHttpServer");
    expect(healthTest).toContain("/health");

    const helper = await renderTemplate("init/tests/helpers/with-http-server.ts.eta", {
      projectName: "demo",
    });
    expect(helper).toContain("listen(0, \"127.0.0.1\")");
  });

  it("R-middleware-05: request-id recipe template", async () => {
    const src = await renderTemplate("middleware/request-id.ts.eta", {
      name: "request-id",
      exportName: "requestIdMiddleware",
    });
    expect(src).toContain("randomUUID");
    expect(src).not.toContain("TODO");
  });

  it("R-resource-05: crud tests include HTTP smoke template", async () => {
    const ctx = {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [],
      routePrefix: "",
    };
    const http = await renderTemplate("resource/http.test.ts.eta", ctx);
    expect(http).toContain("withHttpServer");
    expect(http).toContain("createFakeUserRepository");
  });

  it("R-init-04: init tsconfig uses NodeNext and types node", async () => {
    const json = await renderTemplate("init/tsconfig.json.eta", { projectName: "demo" });
    const tsconfig = JSON.parse(json) as { compilerOptions: Record<string, unknown> };
    expect(tsconfig.compilerOptions.module).toBe("NodeNext");
    expect(tsconfig.compilerOptions.moduleResolution).toBe("NodeNext");
    expect(tsconfig.compilerOptions.types).toEqual(["node"]);

    const main = await renderTemplate("init/src-main.ts.eta", { projectName: "demo" });
    expect(main).toMatch(/from "\.\/app\/server"/);
    expect(main).not.toMatch(/from "\.\/app\/server\.js"/);
  });

  it("R-init-08: init config template and no dotenv dependency", async () => {
    const configSrc = await renderTemplate("init/src-app-config.ts.eta", { projectName: "demo" });
    expect(configSrc).toContain("loadConfig");
    expect(configSrc).toContain("loadEnvFile");
    expect(configSrc).not.toContain("dotenv");

    const example = await renderTemplate("init/env.example.eta", { projectName: "demo" });
    expect(example).toContain("PORT=3000");
    expect(example).toContain("CORS_ORIGIN=");
    expect(example).toContain("BODY_LIMIT_BYTES=1048576");
    expect(example).toContain("BEARER_TOKEN=");
  });

  it("R-init-09: loadConfig validates PORT and NODE_ENV", async () => {
    const configSrc = await renderTemplate("init/src-app-config.ts.eta", { projectName: "demo" });
    expect(configSrc).toContain("DEFAULT_PORT");
    expect(configSrc).toContain("3000");
    expect(configSrc).toContain("DEFAULT_HOST");
    expect(configSrc).toContain("0.0.0.0");
    expect(configSrc).toContain("Invalid PORT");
    expect(configSrc).toContain("Invalid NODE_ENV");
    expect(configSrc).toContain("DEFAULT_SHUTDOWN_GRACE_MS");
    expect(configSrc).toContain("10000");
    expect(configSrc).toContain("CORS_ORIGIN");
    expect(configSrc).toContain("DEFAULT_BODY_LIMIT_BYTES");
    expect(configSrc).toContain("1048576");
    expect(configSrc).toContain("BEARER_TOKEN");
    expect(configSrc).toContain("Invalid BODY_LIMIT_BYTES");
  });

  it("R-crud-01: crud repository is interface only", async () => {
    const ctx = {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [],
      routePrefix: "",
    };
    const repo = await renderTemplate("resource/repository.ts.eta", ctx);
    expect(repo).toContain("export interface UserRepository");
    expect(repo).toContain("findAll(query: ListQuery)");
    expect(repo).not.toMatch(/\bexport (async )?function\b/);
    expect(repo).not.toMatch(/\bexport class\b/);
  });

  it("R-crud-05: manual crud has empty domain fields", async () => {
    const ctx = {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [],
      routePrefix: "",
    };
    const types = await renderTemplate("resource/types.ts.eta", ctx);
    expect(types).toContain("id: string");
    expect(types).not.toContain("name:");

    const validate = await renderTemplate("resource/validate.ts.eta", ctx);
    expect(validate).toContain("No update fields configured");
  });

  it("R-crud-04: crud validate template and controller use parse helpers", async () => {
    const ctx = {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [],
      routePrefix: "",
    };
    const validate = await renderTemplate("resource/validate.ts.eta", ctx);
    expect(validate).toContain("parseCreateInput");
    expect(validate).toContain("ValidateResult");

    const controller = await renderTemplate("resource/controller.ts.eta", ctx);
    expect(controller).toContain("parseCreateInput");
    expect(controller).toContain("parseListQuery");
    expect(controller).toContain("Repository not configured");
  });

  it("R-crud-03: crud routes template includes five methods", async () => {
    const src = await renderTemplate("resource/routes.ts.eta", {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [],
      routePrefix: "",
    });
    expect(src).toContain("HTTP_METHOD.GET");
    expect(src).toContain("HTTP_METHOD.POST");
    expect(src).toContain("HTTP_METHOD.PATCH");
    expect(src).toContain("HTTP_METHOD.DELETE");
    expect((src.match(/method:/g) ?? []).length).toBe(5);
  });

  it("R-init-17: http exports global HTTP constants and scaffold uses them", async () => {
    const http = await renderTemplate("init/src-app-http.ts.eta", { projectName: "demo" });
    expect(http).toContain("export const HTTP_STATUS");
    expect(http).toContain("export const HTTP_METHOD");
    expect(http).toContain("export const HTTP_CONTENT_TYPE");
    expect(http).toContain("export type HttpMethod");

    const health = await renderTemplate("init/src-health-health.routes.ts.eta", {
      projectName: "demo",
    });
    expect(health).toContain("HTTP_METHOD.GET");
    expect(health).not.toMatch(/method:\s*"GET"/);

    const cors = await renderTemplate("init/src-app-middleware-cors.ts.eta", {
      projectName: "demo",
    });
    expect(cors).toContain("HTTP_METHOD.OPTIONS");
    expect(cors).toContain("HTTP_STATUS.NO_CONTENT");
    expect(cors).not.toMatch(/statusCode\s*=\s*204/);

    const bodyLimit = await renderTemplate("init/src-app-middleware-body-limit.ts.eta", {
      projectName: "demo",
    });
    expect(bodyLimit).toContain("HTTP_METHOD.POST");

    const router = await renderTemplate("init/src-app-router.ts.eta", { projectName: "demo" });
    expect(router).toContain("HTTP_METHOD.GET");
    expect(router).toContain("HttpMethod");
  });

  it("R-crud-06: list query is wired through repository service and controller", async () => {
    const ctx = {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [],
      routePrefix: "",
    };
    const service = await renderTemplate("resource/service.ts.eta", ctx);
    expect(service).toContain("list(query: ListQuery)");
    expect(service).toContain("repository.findAll(query)");

    const list = await renderTemplate("init/src-app-list.ts.eta", { projectName: "demo" });
    expect(list).toContain("LIST_DEFAULT_LIMIT = 50");
    expect(list).toContain("LIST_MAX_LIMIT = 100");
    expect(list).toContain("export function parseListQuery");
  });

});
