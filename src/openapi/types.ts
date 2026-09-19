import { JSON_MIME } from "../core/constants.js";
import type { ResourceField } from "../generators/resource-context.js";

export interface OpenApiDocument {
  openapi?: string;
  paths?: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, JsonSchema>;
  };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
}

export interface Operation {
  requestBody?: {
    content?: {
      [JSON_MIME]?: {
        schema?: JsonSchema;
      };
    };
  };
}

export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  $ref?: string;
  enum?: unknown[];
  nullable?: boolean;
}

export interface ExtractedResource {
  name: string;
  fields: ResourceField[];
  routePrefix: string;
}

export interface SkippedPath {
  path: string;
  reason: string;
}

export interface ExtractResult {
  resources: ExtractedResource[];
  skipped: SkippedPath[];
}

export interface ExtractOptions {
  strict?: boolean;
  only?: string[];
}
