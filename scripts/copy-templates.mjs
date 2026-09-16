import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "templates");
const dest = join(root, "dist", "templates");

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

const helpSrc = join(root, "help");
const helpDest = join(root, "dist", "help");
mkdirSync(helpDest, { recursive: true });
cpSync(helpSrc, helpDest, { recursive: true });
