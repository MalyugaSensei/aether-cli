import { describe, expect, it } from "vitest";
import { Project } from "ts-morph";
import { addNamedImportIfMissing, appendModuleRoutesSpreadIfMissing, appendToArrayLiteralIfMissing } from "../../src/core/ast.js";

const sampleApp = `import { healthRoutes } from "./health/health.routes";

const middleware: unknown[] = [requestLogger];
const routes: unknown[] = [...healthRoutes];
`;

describe("ast", () => {
  it("R-middleware-03: addNamedImportIfMissing is idempotent", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sf = project.createSourceFile("app.ts", sampleApp);
    addNamedImportIfMissing(sf, "./app/middleware/auth", ["authMiddleware"]);
    addNamedImportIfMissing(sf, "./app/middleware/auth", ["authMiddleware"]);
    const imports = sf.getImportDeclarations().filter((d) => d.getModuleSpecifierValue().includes("auth"));
    expect(imports).toHaveLength(1);
  });

  it("R-resource-03: appendModuleRoutesSpreadIfMissing does not duplicate spread", () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const comp = `import { healthRoutes } from "../health/health.routes";
import type { Route } from "./router";

export function buildAppRoutes(): Route[] {
  return [...healthRoutes];
}
`;
    const sf = project.createSourceFile("composition.ts", comp);
    appendModuleRoutesSpreadIfMissing(sf, "createUsersModule", "{}");
    appendModuleRoutesSpreadIfMissing(sf, "createUsersModule", "{}");
    const text = sf.getFullText();
    expect(text.match(/createUsersModule\(\{\}\)/g)?.length).toBe(1);
  });
});
