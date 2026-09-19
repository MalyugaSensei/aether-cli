import { describe, expect, it } from "vitest";
import {
  naiveSingular,
  toCamel,
  toPascal,
  validateResourceName,
} from "../../src/core/naming.js";

describe("naming", () => {
  it("validateResourceName accepts kebab-case and rejects invalid names", () => {
    expect(() => validateResourceName("users")).not.toThrow();
    expect(() => validateResourceName("User")).toThrow();
    expect(() => validateResourceName("1bad")).toThrow();
  });

  it("converts users to camel and pascal", () => {
    expect(toCamel("users")).toBe("users");
    expect(toPascal("users")).toBe("Users");
    expect(toCamel("user-profiles")).toBe("userProfiles");
  });

  it("naiveSingular strips trailing s", () => {
    expect(naiveSingular("users")).toBe("user");
    expect(toPascal(naiveSingular("users"))).toBe("User");
  });
});
