import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "../core/project.js";
import { compositionRel } from "../core/paths.js";

export async function runUpgrade(cwd: string, options: { dryRun?: boolean; json?: boolean }): Promise<number> {
  const suggestions: string[] = [];

  if (!existsSync(join(cwd, "package.json"))) {
    suggestions.push("Run chisel init to create a project.");
  } else {
    try {
      loadConfig(cwd);
    } catch (err) {
      suggestions.push(err instanceof Error ? err.message : String(err));
    }

    const comp = compositionRel({ root: cwd, config: loadConfig(cwd), appEntryPath: "" });
    if (!existsSync(join(cwd, comp))) {
      suggestions.push(`Add ${comp} (restore from latest chisel init template).`);
    }
    if (!existsSync(join(cwd, "src/app.ts"))) {
      suggestions.push("Restore src/app.ts from latest chisel init template.");
    }
  }

  const ok = suggestions.length === 0;
  const payload = { ok, suggestions, dryRun: Boolean(options.dryRun) };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (ok) {
    console.log("Project matches current Chisel composition contract.");
  } else {
    console.log("Upgrade suggestions:");
    for (const s of suggestions) {
      console.log(`- ${s}`);
    }
  }

  return ok ? 0 : 1;
}
