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
}

export const DEFAULT_CRUD_FIELDS: ResourceField[] = [
  { name: "name", tsType: "string", required: true },
];

export function buildResourceContext(
  name: string,
  crud: boolean,
  singular?: string,
  fields?: ResourceField[],
): ResourceTemplateContext {
  const resourceKebab = toKebab(name);
  validateResourceName(resourceKebab);
  const resolvedFields = crud ? (fields ?? DEFAULT_CRUD_FIELDS) : [];
  return {
    resourceKebab,
    resourceCamel: toCamel(resourceKebab),
    entityPascal: resolveSingularPascal(resourceKebab, singular),
    crud,
    fields: resolvedFields,
  };
}

export function routesExportName(resourceCamel: string): string {
  return `${resourceCamel}Routes`;
}
