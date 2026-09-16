import { describe, expect, it } from "vitest";
import { renderTemplate } from "../../src/core/render.js";

describe("templates", () => {
  it("R-init-02: init package.json has no runtime dependencies", async () => {
    const json = await renderTemplate("init/package.json.ejs", { projectName: "demo" });
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
    const src = await renderTemplate("init/src-main.ts.ejs", { projectName: "demo" });
    expect(src).toContain('process.once("SIGINT"');
    expect(src).toContain('process.once("SIGTERM"');
    expect(src).toContain("server.close(");
    expect(src).toContain("closeAllConnections()");
    expect(src).toMatch(/10_?000/);
  });

  it("init tsconfig uses NodeNext and types node", async () => {
    const json = await renderTemplate("init/tsconfig.json.ejs", { projectName: "demo" });
    const tsconfig = JSON.parse(json) as { compilerOptions: Record<string, unknown> };
    expect(tsconfig.compilerOptions.module).toBe("NodeNext");
    expect(tsconfig.compilerOptions.moduleResolution).toBe("NodeNext");
    expect(tsconfig.compilerOptions.types).toEqual(["node"]);
  });

  it("R-crud-03: crud routes template includes five methods", async () => {
    const src = await renderTemplate("resource/routes.ts.ejs", {
      resourceKebab: "users",
      resourceCamel: "users",
      entityPascal: "User",
      crud: true,
    });
    expect(src).toContain('method: "GET"');
    expect(src).toContain('method: "POST"');
    expect(src).toContain('method: "PATCH"');
    expect(src).toContain('method: "DELETE"');
    expect((src.match(/method:/g) ?? []).length).toBe(5);
  });
});
