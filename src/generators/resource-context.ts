import {
  resolveSingularPascal,
  toCamel,
  toKebab,
  validateResourceName,
} from "../core/naming.js";

export interface ResourceField {
  name: string;
  tsType: "string" | "number" | "boolean";
  required: boolean;
}

export interface ResourceTemplateContext {
  resourceKebab: string;
  resourceCamel: string;
  entityPascal: string;
  crud: boolean;
  fields: ResourceField[];
  routePrefix: string;
}

export function buildResourceContext(
  name: string,
  crud: boolean,
  singular?: string,
  fields?: ResourceField[],
  routePrefix = "",
): ResourceTemplateContext {
  const resourceKebab = toKebab(name);
  validateResourceName(resourceKebab);
  const resolvedFields = crud ? (fields ?? []) : [];
  return {
    resourceKebab,
    resourceCamel: toCamel(resourceKebab),
    entityPascal: resolveSingularPascal(resourceKebab, singular),
    crud,
    fields: resolvedFields,
    routePrefix,
  };
}

export function moduleFactoryName(entityPascal: string): string {
  return `create${entityPascal}Module`;
}

export function routesExportName(resourceCamel: string): string {
  return `${resourceCamel}Routes`;
}
