import { describe, expect, it } from "vitest";
import { resolveHelpGuidePath, runHelp } from "../../src/commands/help.js";

describe("help", () => {
  it("R-help-01: guide resolves and mentions init", () => {
    const path = resolveHelpGuidePath();
    expect(path).toMatch(/guide\.txt$/);
    expect(runHelp({ color: false })).toBe(0);
  });
});
