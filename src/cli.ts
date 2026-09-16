#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runGenerate } from "./commands/generate.js";

const program = new Command();

program
  .name("chisel")
  .description("Generate Node.js backend source code")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new backend project")
  .option("-f, --force", "Overwrite existing files in target directory")
  .option("--dry-run", "Print planned changes without writing")
  .action(async (options: { force?: boolean; dryRun?: boolean }) => {
    await runInit(process.cwd(), options);
  });

const generate = program
  .command("generate")
  .alias("g")
  .description("Generate application code");

generate
  .command("middleware <name>")
  .description("Generate middleware")
  .option("-f, --force", "Overwrite existing middleware file")
  .option("--dry-run", "Print planned changes without writing")
  .action(async (name: string, options: { force?: boolean; dryRun?: boolean }) => {
    await runGenerate("middleware", name, options);
  });

generate
  .command("resource <name>")
  .description("Generate a resource module")
  .option("--crud", "Generate CRUD endpoints")
  .option("--singular <singular>", "Singular entity name (PascalCase or camelCase)")
  .option("-f, --force", "Overwrite existing resource files")
  .option("--dry-run", "Print planned changes without writing")
  .action(
    async (
      name: string,
      options: {
        crud?: boolean;
        singular?: string;
        force?: boolean;
        dryRun?: boolean;
      },
    ) => {
      await runGenerate("resource", name, options);
    },
  );

await program.parseAsync(process.argv);
