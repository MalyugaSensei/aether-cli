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
      "application/json"?: {
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
}

export interface ExtractedResource {
  name: string;
  fields: ResourceField[];
}
