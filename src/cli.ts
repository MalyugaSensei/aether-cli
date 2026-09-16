#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runGenerate } from "./commands/generate.js";
import { runDoctor } from "./commands/doctor.js";
import { runCheck } from "./commands/check.js";
import { runUpgrade } from "./commands/upgrade.js";
import { runHelp } from "./commands/help.js";
import { CLI_NAME, DEFAULT_APP_ENTRY, EXIT_FAIL, GENERATOR, PACKAGE_JSON } from "./core/constants.js";
import { errorToJson, formatUserError } from "./core/errors.js";

function readCliVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(here, "..", PACKAGE_JSON), "utf8")) as { version: string };
  return pkg.version;
}

const program = new Command();

program
  .name(CLI_NAME)
  .description("Generate Node.js backend source code")
  .version(readCliVersion())
  .option("--json", "Machine-readable JSON output")
  .option("--diff", "With --dry-run, print unified diff preview")
  .addHelpText("after", `\nFull guide: ${CLI_NAME} help\n`);

program
  .command("init")
  .description("Initialize a new backend project")
  .option("-f, --force", "Overwrite existing files in target directory")
  .option("--dry-run", "Print planned changes without writing")
  .action(async (options: { force?: boolean; dryRun?: boolean }) => {
    const globals = program.opts<{ json?: boolean; diff?: boolean }>();
    await runInit(process.cwd(), { ...options, json: globals.json, diff: globals.diff });
  });

program
  .command("upgrade")
  .description("Report migration steps toward current Chisel contract")
  .option("--dry-run", "Report only (default)")
  .action(async (options: { dryRun?: boolean }) => {
    const globals = program.opts<{ json?: boolean }>();
    process.exitCode = await runUpgrade(process.cwd(), {
      dryRun: options.dryRun ?? true,
      json: globals.json,
    });
  });

program
  .command("doctor")
  .description("Diagnose environment and project layout")
  .action(async () => {
    const globals = program.opts<{ json?: boolean }>();
    process.exitCode = await runDoctor(process.cwd(), globals.json);
  });

program
  .command("check")
  .description("Verify Chisel project structure")
  .action(async () => {
    const globals = program.opts<{ json?: boolean }>();
    process.exitCode = await runCheck(process.cwd(), { json: globals.json });
  });

program
  .command("help")
  .description("Full command guide with examples")
  .option("--no-color", "Disable ANSI styling")
  .action((options: { noColor?: boolean }) => {
    const globals = program.opts<{ json?: boolean }>();
    process.exitCode = runHelp({ json: globals.json, color: !options.noColor });
  });

const generate = program
  .command("generate")
  .alias("g")
  .description("Generate application code");

generate
  .command("openapi <spec>")
  .description("Generate CRUD resources from an OpenAPI 3 document")
  .option("--strict", "Fail when any OpenAPI path is skipped")
  .option("--only <names>", "Comma-separated resource names to generate", (v: string) =>
    v.split(",").map((s) => s.trim()).filter(Boolean),
  )
  .option("-f, --force", "Overwrite existing resource files")
  .option("--dry-run", "Print planned changes without writing")
  .action(async (spec: string, options: { force?: boolean; dryRun?: boolean; strict?: boolean; only?: string[] }) => {
    const globals = program.opts<{ json?: boolean; diff?: boolean }>();
    await runGenerate(GENERATOR.openapi, undefined, { specPath: spec, ...options, json: globals.json, diff: globals.diff });
  });

generate
  .command("middleware <name>")
  .description("Generate middleware")
  .option("--global", `Register in ${DEFAULT_APP_ENTRY} global middleware chain`)
  .option("-f, --force", "Overwrite existing middleware file")
  .option("--dry-run", "Print planned changes without writing")
  .action(async (name: string, options: { global?: boolean; force?: boolean; dryRun?: boolean }) => {
    const globals = program.opts<{ json?: boolean; diff?: boolean }>();
    await runGenerate(GENERATOR.middleware, name, { ...options, json: globals.json, diff: globals.diff });
  });

generate
  .command("resource <name>")
  .description("Generate a resource module")
  .option("--crud", "Generate CRUD endpoints")
  .option("--singular <singular>", "Singular entity name (PascalCase or camelCase)")
  .option(
    "--tests",
    "With --crud: generate tests/ on create; on existing CRUD resource: add tests only",
  )
  .option("-f, --force", "Overwrite existing resource files")
  .option("--dry-run", "Print planned changes without writing")
  .action(
    async (
      name: string,
      options: {
        crud?: boolean;
        singular?: string;
        tests?: boolean;
        force?: boolean;
        dryRun?: boolean;
      },
    ) => {
      const globals = program.opts<{ json?: boolean; diff?: boolean }>();
      await runGenerate(GENERATOR.resource, name, { ...options, json: globals.json, diff: globals.diff });
    },
  );

try {
  await program.parseAsync(process.argv);
} catch (err) {
  const globals = program.opts<{ json?: boolean }>();
  if (globals.json) {
    console.error(JSON.stringify({ ok: false, error: errorToJson(err) }, null, 2));
  } else {
    console.error(formatUserError(err));
  }
  process.exitCode = EXIT_FAIL;
}
