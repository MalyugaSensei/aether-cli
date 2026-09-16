import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  APP_DIR,
  APP_ENTRY_BASENAME,
  COMPOSITION_BASENAME,
  CONFIG_FILE,
  CONFIG_VERSION,
  DEFAULT_APP_ENTRY,
  DEFAULT_SRC_DIR,
  PACKAGE_JSON,
} from "./constants.js";

export interface ChiselConfig {
  version: number;
  srcDir: string;
  appEntry: string;
}

const DEFAULT_CONFIG: ChiselConfig = {
  version: CONFIG_VERSION,
  srcDir: DEFAULT_SRC_DIR,
  appEntry: DEFAULT_APP_ENTRY,
};

export interface ProjectContext {
  root: string;
  config: ChiselConfig;
  appEntryPath: string;
}

export function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(join(dir, PACKAGE_JSON))) {
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
  if (raw.version !== undefined && raw.version !== CONFIG_VERSION) {
    throw new Error(
      `Unsupported ${CONFIG_FILE} version: ${raw.version}. Expected ${CONFIG_VERSION}.`,
    );
  }
  const srcDir = raw.srcDir ?? DEFAULT_CONFIG.srcDir;
  const appEntry = raw.appEntry ?? DEFAULT_CONFIG.appEntry;
  if (!srcDir || srcDir.includes("..") || srcDir.startsWith("/")) {
    throw new Error(`Invalid ${CONFIG_FILE} srcDir: "${srcDir}".`);
  }
  if (!appEntry || appEntry.includes("..")) {
    throw new Error(`Invalid ${CONFIG_FILE} appEntry: "${appEntry}".`);
  }
  return { version: CONFIG_VERSION, srcDir, appEntry };
}

export function loadConfig(root: string): ChiselConfig {
  const configPath = join(root, CONFIG_FILE);
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  let raw: Partial<ChiselConfig>;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf8")) as Partial<ChiselConfig>;
  } catch {
    throw new Error(`Invalid JSON in ${CONFIG_FILE} at ${configPath}.`);
  }
  return validateChiselConfig(raw);
}

export function createProjectContext(startDir: string): ProjectContext {
  const root = findProjectRoot(startDir);
  const config = loadConfig(root);
  const appEntryPath = join(root, config.appEntry);
  if (!existsSync(appEntryPath)) {
    throw new Error(
      `App entry not found at ${config.appEntry}. Run \`chisel init\` or restore ${DEFAULT_APP_ENTRY}.`,
    );
  }
  const compositionPath = join(root, config.srcDir, APP_DIR, COMPOSITION_BASENAME);
  if (!existsSync(compositionPath)) {
    throw new Error(
      `Composition entry not found at ${config.srcDir}/${APP_DIR}/${COMPOSITION_BASENAME}. Run \`chisel init\` or restore it.`,
    );
  }
  return { root, config, appEntryPath };
}

export function isChiselInitialized(root: string): boolean {
  return existsSync(join(root, DEFAULT_SRC_DIR, APP_ENTRY_BASENAME)) || existsSync(join(root, PACKAGE_JSON));
}
