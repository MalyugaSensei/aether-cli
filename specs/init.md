# init

## Command and flags

- `chisel init`
- `--force` — overwrite existing init template files
- `--dry-run` — print the plan only

## Preconditions

- Target directory is empty, or `--force` is passed.

## Created files

- `package.json`
- `tsconfig.json`
- `.gitignore`
- `chisel.config.json`
- `src/main.ts`
- `src/app.ts`
- `src/app/server.ts`
- `src/app/router.ts`
- `src/app/http.ts`
- `src/app/middleware/types.ts`
- `src/app/middleware/request-logger.ts`
- `src/health/health.routes.ts`

## Modified files

- None.

## Idempotency

- Running `init` again without `--force` fails if any key file already exists.

## Acceptance criteria

- R-init-01: creates the full set of files for a basic HTTP service.
- R-init-02: `package.json` is CommonJS (no `"type": "module"`), no runtime `dependencies`; devDependencies: TypeScript ^7, `@types/node` ^24 (major matches Node major), `tsx`; scripts `build` / `start` / `dev` (`tsx watch`); optional `engines.node >= 24`.
- R-init-04: `tsconfig.json` — `module` + `moduleResolution` = `NodeNext`, `types: ["node"]`; local imports in `src/` without file extensions.
- R-init-03: without `--force`, refuses a non-empty directory (presence of `src/app.ts` or `package.json`).
- R-init-05: `src/main.ts` — on `SIGINT` / `SIGTERM` stops accepting new connections (`server.close()`), waits up to 10 s for in-flight requests, then forcibly closes remaining connections (`server.closeAllConnections()`); process exits with code `0` on successful close.

## Out of scope

- ORM, Docker, OpenAPI, migrations.
