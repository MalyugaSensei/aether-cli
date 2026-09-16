import type { ResourceField } from "../generators/resource-context.js";
import type { ExtractedResource, JsonSchema, OpenApiDocument, PathItem } from "./types.js";

function mapOpenApiType(schema: JsonSchema): ResourceField["tsType"] | undefined {
  if (schema.type === "string") return "string";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "number" || schema.type === "integer") return "number";
  return undefined;
}

function resolveSchema(doc: OpenApiDocument, schema: JsonSchema | undefined): JsonSchema | undefined {
  if (!schema) return undefined;
  const ref = schema.$ref;
  if (!ref) return schema;
  const prefix = "#/components/schemas/";
  if (!ref.startsWith(prefix)) {
    throw new Error(`Unsupported $ref: ${ref}. Only ${prefix}{Name} is supported.`);
  }
  const name = ref.slice(prefix.length);
  return doc.components?.schemas?.[name];
}

function fieldsFromPostSchema(doc: OpenApiDocument, item: PathItem): ResourceField[] | undefined {
  const schema = resolveSchema(doc, item.post?.requestBody?.content?.["application/json"]?.schema);
  if (!schema?.properties) return undefined;

  const requiredSet = new Set(schema.required ?? []);
  const fields: ResourceField[] = [];

  for (const [name, propSchema] of Object.entries(schema.properties)) {
    if (name === "id") continue;
    const resolved = resolveSchema(doc, propSchema) ?? propSchema;
    const tsType = mapOpenApiType(resolved);
    if (!tsType) continue;
    fields.push({
      name,
      tsType,
      required: requiredSet.has(name),
    });
  }

  return fields.length > 0 ? fields : undefined;
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function extractResources(doc: OpenApiDocument): ExtractedResource[] {
  const paths = doc.paths ?? {};
  const collectionPaths = new Map<string, string>();

  for (const rawPath of Object.keys(paths)) {
    const path = normalizePath(rawPath);
    const match = path.match(/^\/([^/]+)\/\{id\}$/);
    if (match) {
      collectionPaths.set(match[1]!, rawPath);
    }
  }

  const resources: ExtractedResource[] = [];

  for (const rawPath of Object.keys(paths)) {
    const path = normalizePath(rawPath);
    const collectionMatch = path.match(/^\/([^/]+)$/);
    if (!collectionMatch) continue;

    const name = collectionMatch[1]!;
    if (!collectionPaths.has(name)) continue;

    const collectionItem = paths[rawPath];
    if (!collectionItem) continue;

    const fields = fieldsFromPostSchema(doc, collectionItem);
    if (!fields) continue;

    resources.push({ name, fields });
  }

  return resources;
}
