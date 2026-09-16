import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { parse as parseYaml } from "yaml";
import type { OpenApiDocument } from "./types.js";

export function loadOpenApiSpec(absPath: string): OpenApiDocument {
  const raw = readFileSync(absPath, "utf8");
  const ext = extname(absPath).toLowerCase();
  const doc =
    ext === ".yaml" || ext === ".yml"
      ? (parseYaml(raw) as OpenApiDocument)
      : (JSON.parse(raw) as OpenApiDocument);

  if (!doc.openapi?.startsWith("3.")) {
    throw new Error("Only OpenAPI 3.x documents are supported.");
  }
  if (!doc.paths || typeof doc.paths !== "object") {
    throw new Error("OpenAPI document has no paths.");
  }
  return doc;
}
