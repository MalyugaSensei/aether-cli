import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Eta } from "eta";
import prettier from "prettier";
import { DIST_DIR, TEMPLATES_DIRNAME } from "./constants.js";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const eta = new Eta({ autoEscape: false, autoTrim: false });

export function templatesDir(): string {
  const built = join(packageRoot, DIST_DIR, TEMPLATES_DIRNAME);
  const dev = join(packageRoot, TEMPLATES_DIRNAME);
  try {
    readFileSync(join(built, "init", "package.json.eta"));
    return built;
  } catch {
    return dev;
  }
}

export async function renderTemplate(
  templateRelPath: string,
  data: Record<string, unknown> | object,
): Promise<string> {
  const full = join(templatesDir(), templateRelPath);
  const raw = readFileSync(full, "utf8");
  const rendered = eta.renderString(raw, data);
  return formatContents(rendered, full);
}

export async function formatContents(contents: string, filePath: string): Promise<string> {
  const parser =
    filePath.endsWith(".json") || filePath.endsWith(".json.eta")
      ? "json"
      : filePath.endsWith(".md")
        ? "markdown"
        : "typescript";
  try {
    return await prettier.format(contents, {
      parser,
      singleQuote: false,
      trailingComma: "all",
      printWidth: 100,
    });
  } catch {
    return contents;
  }
}
