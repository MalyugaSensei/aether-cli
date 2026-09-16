import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
    const { copyFileSync } = await import("node:fs");
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

  it("R-openapi-03: second openapi run fails without force", async () => {
    const second = await runChisel(["g", "openapi", "api.json"], dir);
    expect(second.code).not.toBe(0);
  });
});
