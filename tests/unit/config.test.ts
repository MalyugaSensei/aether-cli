import { describe, expect, it } from "vitest";
import { validateChiselConfig } from "../../src/core/project.js";

describe("config", () => {
  it("R-config-01: rejects unsupported config version", () => {
    expect(() => validateChiselConfig({ version: 99 })).toThrow(/Unsupported/);
  });

  it("R-config-02: accepts custom srcDir", () => {
    const cfg = validateChiselConfig({ srcDir: "lib", appEntry: "lib/app.ts" });
    expect(cfg.srcDir).toBe("lib");
  });
});
