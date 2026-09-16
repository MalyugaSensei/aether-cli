const RESOURCE_NAME_RE = /^[a-z][a-z0-9-]*$/;

export function validateResourceName(name: string): void {
  if (!RESOURCE_NAME_RE.test(name)) {
    throw new Error(
      `Invalid name "${name}". Use kebab-case: lowercase letters, digits, hyphens; must start with a letter.`,
    );
  }
}

export function toKebab(name: string): string {
  return name.replace(/_/g, "-").toLowerCase();
}

export function toCamel(name: string): string {
  const parts = toKebab(name).split("-").filter(Boolean);
  return parts
    .map((p, i) => (i === 0 ? p : p[0]!.toUpperCase() + p.slice(1)))
    .join("");
}

export function toPascal(name: string): string {
  const camel = toCamel(name);
  return camel[0]!.toUpperCase() + camel.slice(1);
}

/** Naive plural → singular for type names (users → User). Override with --singular. */
export function naiveSingular(pluralKebab: string): string {
  const camel = toCamel(pluralKebab);
  if (camel.endsWith("ies") && camel.length > 3) {
    return camel.slice(0, -3) + "y";
  }
  if (camel.endsWith("ses") || camel.endsWith("xes") || camel.endsWith("zes")) {
    return camel.slice(0, -2);
  }
  if (camel.endsWith("s") && !camel.endsWith("ss") && camel.length > 1) {
    return camel.slice(0, -1);
  }
  return camel;
}

export function resolveSingularPascal(pluralKebab: string, singularOption?: string): string {
  if (singularOption) {
    const s = singularOption.trim();
    if (/^[A-Z]/.test(s)) return s;
    return toPascal(s);
  }
  return toPascal(naiveSingular(pluralKebab));
}

export function middlewareFileName(name: string): string {
  validateResourceName(toKebab(name));
  return toKebab(name);
}

export function middlewareExportName(name: string): string {
  return `${toCamel(middlewareFileName(name))}Middleware`;
}
