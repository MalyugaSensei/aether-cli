import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { runChisel } from "../helpers/run-cli.js";
import { tscCheck } from "../helpers/tsc-check.js";

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtures = join(cliRoot, "tests/fixtures");

describe("integration: openapi", () => {
  const dir = mkdtempSync(join(tmpdir(), "chisel-openapi-"));

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("R-openapi-02: generates users resource from spec", async () => {
    expect((await runChisel(["init"], dir)).code).toBe(0);
    const specCopy = join(dir, "api.json");
    copyFileSync(join(fixtures, "users.openapi.json"), specCopy);

    const r = await runChisel(["g", "openapi", "api.json"], dir);
    expect(r.code).toBe(0);

    const types = readFileSync(join(dir, "src/users/users.types.ts"), "utf8");
    expect(types).toContain("email: string");
    expect(types).toContain("age: number");
    const validate = readFileSync(join(dir, "src/users/users.validate.ts"), "utf8");
    expect(validate).toContain("parseCreateInput");
    expect(tscCheck(dir, [join(cliRoot, "node_modules/@types")])).toEqual([]);
  });

  it("R-openapi-03: second run without force updates types and validate", async () => {
    writeFileSync(join(dir, "src/users/users.service.ts"), `${readFileSync(join(dir, "src/users/users.service.ts"), "utf8")}\nexport const HAND_EDIT = true;\n`);
    writeFileSync(join(dir, "src/users/users.controller.ts"), `${readFileSync(join(dir, "src/users/users.controller.ts"), "utf8")}\nexport const HAND_EDIT = true;\n`);
    writeFileSync(join(dir, "src/users/users.repository.ts"), `${readFileSync(join(dir, "src/users/users.repository.ts"), "utf8")}\nexport const HAND_EDIT = true;\n`);

    const spec = JSON.parse(readFileSync(join(dir, "api.json"), "utf8")) as {
      paths: {
        "/users": {
          post: {
            requestBody: {
              content: { "application/json": { schema: { properties: Record<string, { type: string }>; required: string[] } } };
            };
          };
        };
      };
    };
    spec.paths["/users"].post.requestBody.content["application/json"].schema.properties.nickname = {
      type: "string",
    };
    spec.paths["/users"].post.requestBody.content["application/json"].schema.required.push("nickname");
    writeFileSync(join(dir, "api.json"), JSON.stringify(spec, null, 2));

    const second = await runChisel(["g", "openapi", "api.json"], dir);
    expect(second.code).toBe(0);

    const types = readFileSync(join(dir, "src/users/users.types.ts"), "utf8");
    expect(types).toContain("nickname: string");
    const validate = readFileSync(join(dir, "src/users/users.validate.ts"), "utf8");
    expect(validate).toContain("nickname");
  });

  it("R-openapi-09: schema sync does not rewrite service controller or repository", () => {
    expect(readFileSync(join(dir, "src/users/users.service.ts"), "utf8")).toContain("HAND_EDIT");
    expect(readFileSync(join(dir, "src/users/users.controller.ts"), "utf8")).toContain("HAND_EDIT");
    expect(readFileSync(join(dir, "src/users/users.repository.ts"), "utf8")).toContain("HAND_EDIT");
  });

  it("R-openapi-10: --force overwrites the full resource module", async () => {
    const forced = await runChisel(["g", "openapi", "api.json", "--force"], dir);
    expect(forced.code).toBe(0);
    expect(readFileSync(join(dir, "src/users/users.service.ts"), "utf8")).not.toContain("HAND_EDIT");
    expect(readFileSync(join(dir, "src/users/users.types.ts"), "utf8")).toContain("nickname: string");
    expect(tscCheck(dir, [join(cliRoot, "node_modules/@types")])).toEqual([]);
  });
});
