import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractResources } from "../../src/openapi/extract-resources.js";
import { loadOpenApiSpec } from "../../src/openapi/load-spec.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

describe("openapi", () => {
  it("R-openapi-01: parses JSON and YAML specs", () => {
    const json = loadOpenApiSpec(join(fixtures, "users.openapi.json"));
    const yaml = loadOpenApiSpec(join(fixtures, "users.openapi.yaml"));
    expect(json.openapi).toMatch(/^3\./);
    expect(yaml.openapi).toMatch(/^3\./);
  });

  it("R-openapi-02: extracts fields from POST schema", () => {
    const doc = loadOpenApiSpec(join(fixtures, "users.openapi.json"));
    const resources = extractResources(doc).resources;
    expect(resources).toHaveLength(1);
    expect(resources[0]?.name).toBe("users");
    expect(resources[0]?.fields).toEqual(
      expect.arrayContaining([
        { name: "name", tsType: "string", required: true },
        { name: "email", tsType: "string", required: true },
        { name: "age", tsType: "number", required: false },
      ]),
    );
  });

  it("R-openapi-04: skips collections without item path or POST schema", () => {
    const doc = loadOpenApiSpec(join(fixtures, "users.openapi.yaml"));
    const resources = extractResources(doc).resources;
    expect(resources).toHaveLength(1);
    expect(resources[0]?.fields).toEqual([{ name: "name", tsType: "string", required: true }]);

    const noItem = {
      openapi: "3.0.3",
      paths: {
        "/items": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["title"],
                    properties: { title: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    };
    expect(extractResources(noItem).resources).toHaveLength(0);
  });

  it("R-openapi-07: POST schema via component ref", () => {
    const doc = loadOpenApiSpec(join(fixtures, "users-ref.openapi.json"));
    const resources = extractResources(doc).resources;
    expect(resources[0]?.fields).toEqual(
      expect.arrayContaining([
        { name: "name", tsType: "string", required: true },
        { name: "role", tsType: "string", required: false },
      ]),
    );
  });

  it("R-openapi-08: multi-resource spec", () => {
    const doc = loadOpenApiSpec(join(fixtures, "multi.openapi.json"));
    const { resources } = extractResources(doc);
    expect(resources.map((r) => r.name).sort()).toEqual(["orders", "users"]);
  });
});
