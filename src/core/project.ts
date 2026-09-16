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

export function loadConfig(root: string): ChiselConfig {
  const configPath = join(root, "chisel.config.json");
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  const raw = JSON.parse(readFileSync(configPath, "utf8")) as Partial<ChiselConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...raw,
  };
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
  return { root, config, appEntryPath };
}

export function isChiselInitialized(root: string): boolean {
  return existsSync(join(root, "src", "app.ts")) || existsSync(join(root, "package.json"));
}
