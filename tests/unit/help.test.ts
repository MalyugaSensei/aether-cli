import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveHelpGuidePath, runHelp } from "../../src/commands/help.js";

describe("help", () => {
  it("R-help-01: guide exits 0 and includes quick-start aether init", () => {
    const path = resolveHelpGuidePath();
    const guide = readFileSync(path, "utf8");
    expect(guide).toMatch(/aether init/);
    expect(guide).toMatch(/QUICK START/i);
    expect(runHelp({ color: false })).toBe(0);
  });
});
