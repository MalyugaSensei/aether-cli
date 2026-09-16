import {
  resolveSingularPascal,
  toCamel,
  toKebab,
  validateResourceName,
} from "../core/naming.js";

export interface ResourceTemplateContext {
  resourceKebab: string;
  resourceCamel: string;
  entityPascal: string;
  crud: boolean;
}

export function buildResourceContext(
  name: string,
  crud: boolean,
  singular?: string,
): ResourceTemplateContext {
  const resourceKebab = toKebab(name);
  validateResourceName(resourceKebab);
  return {
    resourceKebab,
    resourceCamel: toCamel(resourceKebab),
    entityPascal: resolveSingularPascal(resourceKebab, singular),
    crud,
  };
}

export function routesExportName(resourceCamel: string): string {
  return `${resourceCamel}Routes`;
}
