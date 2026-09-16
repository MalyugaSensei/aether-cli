import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";
import prettier from "prettier";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function templatesDir(): string {
  const built = join(packageRoot, "dist", "templates");
  const dev = join(packageRoot, "templates");
  try {
    readFileSync(join(built, "init", "package.json.ejs"));
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
  const rendered = ejs.render(raw, data, { rmWhitespace: false });
  return formatContents(rendered, full);
}

export async function formatContents(contents: string, filePath: string): Promise<string> {
  const parser =
    filePath.endsWith(".json") || filePath.endsWith(".json.ejs")
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
