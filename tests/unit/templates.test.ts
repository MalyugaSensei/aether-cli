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
  });

  it("R-init-07: init app catches request errors", async () => {
    const app = await renderTemplate("init/src-app.ts.eta", { projectName: "demo" });
    expect(app).toContain("handleRequestError");
    expect(app).toContain("catch (err)");
  });

  it("init tsconfig uses NodeNext and types node", async () => {
    const json = await renderTemplate("init/tsconfig.json.eta", { projectName: "demo" });
    const tsconfig = JSON.parse(json) as { compilerOptions: Record<string, unknown> };
    expect(tsconfig.compilerOptions.module).toBe("NodeNext");
    expect(tsconfig.compilerOptions.moduleResolution).toBe("NodeNext");
    expect(tsconfig.compilerOptions.types).toEqual(["node"]);
  });

  it("R-init-08: init config template and no dotenv dependency", async () => {
    const configSrc = await renderTemplate("init/src-app-config.ts.eta", { projectName: "demo" });
    expect(configSrc).toContain("loadConfig");
    expect(configSrc).toContain("loadEnvFile");
    expect(configSrc).not.toContain("dotenv");

    const example = await renderTemplate("init/env.example.eta", { projectName: "demo" });
    expect(example).toContain("PORT=3000");

    const json = await renderTemplate("init/package.json.eta", { projectName: "demo" });
    const pkg = JSON.parse(json) as { dependencies?: Record<string, string> };
    expect(pkg.dependencies).toBeUndefined();
  });

  it("R-init-09: loadConfig validates PORT and NODE_ENV", async () => {
    const configSrc = await renderTemplate("init/src-app-config.ts.eta", { projectName: "demo" });
    expect(configSrc).toContain('process.env.PORT ?? "3000"');
    expect(configSrc).toContain('process.env.HOST ?? "0.0.0.0"');
    expect(configSrc).toContain('Invalid PORT');
    expect(configSrc).toContain("Invalid NODE_ENV");
    expect(configSrc).toContain('"10000"');
  });

  it("R-crud-04: crud validate template and controller use parse helpers", async () => {
    const ctx = {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [
        { name: "name", tsType: "string" as const, required: true },
        { name: "email", tsType: "string" as const, required: true },
      ],
    };
    const validate = await renderTemplate("resource/validate.ts.eta", ctx);
    expect(validate).toContain("parseCreateInput");
    expect(validate).toContain("ValidateResult");
    expect(validate).toContain("Zod/Ajv");

    const controller = await renderTemplate("resource/controller.ts.eta", ctx);
    expect(controller).toContain("parseCreateInput");
    expect(controller).not.toContain("function isCreateInput");
  });

  it("R-crud-01: crud repository has TODO stubs and no in-memory store", async () => {
    const src = await renderTemplate("resource/repository.ts.eta", {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [{ name: "name", tsType: "string", required: true }],
    });
    expect(src).toContain("TODO: implement findAll");
    expect(src).not.toMatch(/\bMap\b/);
    expect(src).not.toContain("randomUUID");
  });

  it("R-crud-03: crud routes template includes five methods", async () => {
    const src = await renderTemplate("resource/routes.ts.eta", {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
      fields: [{ name: "name", tsType: "string", required: true }],
    });
    expect(src).toContain('method: "GET"');
    expect(src).toContain('method: "POST"');
    expect(src).toContain('method: "PATCH"');
    expect(src).toContain('method: "DELETE"');
    expect((src.match(/method:/g) ?? []).length).toBe(5);
  });
});
