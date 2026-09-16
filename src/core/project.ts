import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ChiselConfig {
  version: number;
  srcDir: string;
  appEntry: string;
}

const DEFAULT_CONFIG: ChiselConfig = {
  version: 1,
  srcDir: "src",
  appEntry: "src/app.ts",
};

export interface ProjectContext {
  root: string;
  config: ChiselConfig;
  appEntryPath: string;
}

export function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(join(dir, "package.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        "Not inside a Node.js project (no package.json found). Run `chisel init` first.",
      );
    }
    dir = parent;
  }
}

export function validateChiselConfig(raw: Partial<ChiselConfig>): ChiselConfig {
  if (raw.version !== undefined && raw.version !== 1) {
    throw new Error(`Unsupported chisel.config.json version: ${raw.version}. Expected 1.`);
  }
  const srcDir = raw.srcDir ?? DEFAULT_CONFIG.srcDir;
  const appEntry = raw.appEntry ?? DEFAULT_CONFIG.appEntry;
  if (!srcDir || srcDir.includes("..") || srcDir.startsWith("/")) {
    throw new Error(`Invalid chisel.config.json srcDir: "${srcDir}".`);
  }
  if (!appEntry || appEntry.includes("..")) {
    throw new Error(`Invalid chisel.config.json appEntry: "${appEntry}".`);
  }
  return { version: 1, srcDir, appEntry };
}

export function loadConfig(root: string): ChiselConfig {
  const configPath = join(root, "chisel.config.json");
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  let raw: Partial<ChiselConfig>;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf8")) as Partial<ChiselConfig>;
  } catch {
    throw new Error(`Invalid JSON in chisel.config.json at ${configPath}.`);
  }
  return validateChiselConfig(raw);
}

export function createProjectContext(startDir: string): ProjectContext {
  const root = findProjectRoot(startDir);
  const config = loadConfig(root);
  const appEntryPath = join(root, config.appEntry);
  if (!existsSync(appEntryPath)) {
    throw new Error(
      `App entry not found at ${config.appEntry}. Run \`chisel init\` or restore src/app.ts.`,
    );
  }
  const compositionPath = join(root, config.srcDir, "app", "composition.ts");
  if (!existsSync(compositionPath)) {
    throw new Error(
      `Composition entry not found at ${config.srcDir}/app/composition.ts. Run \`chisel init\` or restore it.`,
    );
  }
  return { root, config, appEntryPath };
}

export function isChiselInitialized(root: string): boolean {
  return existsSync(join(root, "src", "app.ts")) || existsSync(join(root, "package.json"));
}
