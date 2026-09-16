import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ChiselError } from "../core/errors.js";

const ESC = "\x1b";
const bold = (s: string) => `${ESC}[1m${s}${ESC}[0m`;
const dim = (s: string) => `${ESC}[2m${s}${ESC}[0m`;
const cyan = (s: string) => `${ESC}[36m${s}${ESC}[0m`;
const green = (s: string) => `${ESC}[32m${s}${ESC}[0m`;

export function resolveHelpGuidePath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const packaged = join(here, "..", "help", "guide.txt");
  if (existsSync(packaged)) {
    return packaged;
  }
  const dev = join(here, "..", "..", "help", "guide.txt");
  if (existsSync(dev)) {
    return dev;
  }
  throw new ChiselError("NOT_FOUND", "Help guide missing. Run npm run build.");
}

function paintGuide(raw: string, color: boolean): string {
  if (!color) {
    return raw;
  }

  return raw
    .split("\n")
    .map((line) => {
      if (line.includes("┌") || line.includes("└") || line.includes("│")) {
        return cyan(line);
      }
      if (/^  [A-Z][A-Z0-9 ]+$/.test(line)) {
        return bold(cyan(line.trimEnd()));
      }
      if (/^  ─/.test(line)) {
        return dim(line);
      }
      if (/^    chisel /.test(line)) {
        return `    ${green("chisel")}${line.slice("    chisel".length)}`;
      }
      if (/^      chisel /.test(line)) {
        return `      ${green("chisel")}${line.slice("      chisel".length)}`;
      }
      return line;
    })
    .join("\n");
}

export function runHelp(options: { json?: boolean; color?: boolean }): number {
  const path = resolveHelpGuidePath();
  const text = readFileSync(path, "utf8");
  const useColor = options.color !== false && process.stdout.isTTY;

  if (options.json) {
    console.log(JSON.stringify({ ok: true, guide: text.trim() }, null, 2));
    return 0;
  }

  console.log(paintGuide(text, useColor).trimEnd());
  return 0;
}
