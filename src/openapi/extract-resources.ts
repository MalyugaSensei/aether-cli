import { JSON_MIME, OPENAPI_SCHEMA_REF_PREFIX } from "../core/constants.js";
import type { ResourceField } from "../generators/resource-context.js";
import type {
  ExtractOptions,
  ExtractResult,
  ExtractedResource,
  JsonSchema,
  OpenApiDocument,
  PathItem,
  SkippedPath,
} from "./types.js";

function mapOpenApiType(schema: JsonSchema): ResourceField["tsType"] | undefined {
  if (schema.enum && schema.enum.length > 0) {
    return "string";
  }
  if (schema.type === "string") return "string";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "number" || schema.type === "integer") return "number";
  return undefined;
}

function resolveSchema(doc: OpenApiDocument, schema: JsonSchema | undefined): JsonSchema | undefined {
  if (!schema) return undefined;
  const ref = schema.$ref;
  if (!ref) return schema;
  const prefix = OPENAPI_SCHEMA_REF_PREFIX;
  if (!ref.startsWith(prefix)) {
    throw new Error(`Unsupported $ref: ${ref}. Only ${prefix}{Name} is supported.`);
  }
  const name = ref.slice(prefix.length);
  return doc.components?.schemas?.[name];
}

function fieldsFromRequestSchema(
  doc: OpenApiDocument,
  item: PathItem,
  method: "post" | "patch" | "put",
): ResourceField[] | undefined {
  const op = item[method];
  const schema = resolveSchema(doc, op?.requestBody?.content?.[JSON_MIME]?.schema);
  if (!schema?.properties) return undefined;

  const requiredSet = new Set(schema.required ?? []);
  const fields: ResourceField[] = [];

  for (const [name, propSchema] of Object.entries(schema.properties)) {
    if (name === "id") continue;
    const resolved = resolveSchema(doc, propSchema) ?? propSchema;
    const tsType = mapOpenApiType(resolved);
    if (!tsType) continue;
    const required = requiredSet.has(name) && !resolved.nullable;
    fields.push({ name, tsType, required });
  }

  return fields.length > 0 ? fields : undefined;
}

function mergeFieldSets(post: ResourceField[], patch: ResourceField[]): ResourceField[] {
  const map = new Map<string, ResourceField>();
  for (const f of post) {
    map.set(f.name, f);
  }
  for (const f of patch) {
    if (!map.has(f.name)) {
      map.set(f.name, { ...f, required: false });
    }
  }
  return [...map.values()];
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function collectionNameAndPrefix(path: string): { name: string; routePrefix: string } | null {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const name = segments[segments.length - 1]!;
  const prefixSegments = segments.slice(0, -1);
  const routePrefix = prefixSegments.length > 0 ? `/${prefixSegments.join("/")}` : "";
  return { name, routePrefix };
}

function findItemPathForCollection(
  paths: Record<string, PathItem>,
  collectionPath: string,
): string | undefined {
  for (const rawPath of Object.keys(paths)) {
    const path = normalizePath(rawPath);
    const match = path.match(/^(.+)\/\{[^}]+\}$/);
    if (!match) continue;
    if (normalizePath(match[1]!) === collectionPath) {
      return rawPath;
    }
  }
  return undefined;
}

export function extractResources(doc: OpenApiDocument, options: ExtractOptions = {}): ExtractResult {
  const paths = doc.paths ?? {};
  const skipped: SkippedPath[] = [];
  const resources: ExtractedResource[] = [];
  const onlySet = options.only ? new Set(options.only.map((n) => n.toLowerCase())) : undefined;

  for (const rawPath of Object.keys(paths)) {
    const path = normalizePath(rawPath);
    const parsed = collectionNameAndPrefix(path);
    if (!parsed) continue;

    const collectionItem = paths[rawPath];
    if (!collectionItem) continue;

    const itemRaw = findItemPathForCollection(paths, path);
    if (!itemRaw) {
      skipped.push({ path: rawPath, reason: "missing item path with path parameter" });
      continue;
    }

    const postFields = fieldsFromRequestSchema(doc, collectionItem, "post");
    if (!postFields) {
      skipped.push({ path: rawPath, reason: "missing POST JSON request body schema" });
      continue;
    }

    const itemPath = paths[itemRaw]!;
    const patchFields =
      fieldsFromRequestSchema(doc, itemPath, "patch") ??
      fieldsFromRequestSchema(doc, itemPath, "put") ??
      [];
    const fields = mergeFieldSets(postFields, patchFields);

    if (onlySet && !onlySet.has(parsed.name.toLowerCase())) {
      skipped.push({ path: rawPath, reason: "filtered by --only" });
      continue;
    }

    resources.push({
      name: parsed.name,
      fields,
      routePrefix: parsed.routePrefix,
    });
  }

  if (options.strict && skipped.length > 0) {
    const detail = skipped.map((s) => `${s.path}: ${s.reason}`).join("; ");
    throw new Error(`OpenAPI strict mode: skipped paths — ${detail}`);
  }

  return { resources, skipped };
}
