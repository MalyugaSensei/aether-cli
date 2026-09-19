# init

## Command and flags

- `aether init`
- `--force` — overwrite existing init template files
- `--dry-run` — print the plan only

## Preconditions

- Target directory is empty, or `--force` is passed.

## Created files

- `package.json`
- `tsconfig.json`
- `.gitignore`
- `aether.config.json`
- `.env.example`
- `.env` — only when `.env` is not already present in the target directory
- `src/main.ts`
- `src/app/composition.ts`
- `src/app.ts`
- `src/app/config.ts`
- `src/app/server.ts`
- `src/app/router.ts`
- `src/app/http.ts`
- `src/app/list.ts`
- `src/app/logger.ts`
- `src/app/middleware/types.ts`
- `src/app/middleware/request-logger.ts`
- `src/app/middleware/error-handler.ts`
- `src/app/middleware/cors.ts`
- `src/app/middleware/body-limit.ts`
- `src/app/middleware/bearer-auth.ts`
- `src/health/health.routes.ts`

## Modified files

- None.

## Idempotency

- Running `init` again without `--force` fails if any key file already exists.
- `init --force` overwrites scaffold template files but **does not** overwrite an existing `.env`.

## Acceptance criteria

- R-init-01: creates the full set of files for a basic HTTP service.
- R-init-02: `package.json` is CommonJS (no `"type": "module"`), no runtime `dependencies`; devDependencies: TypeScript ^7, `@types/node` ^24 (major matches Node major), `tsx`; scripts `build` / `start` / `dev` (`tsx watch`); optional `engines.node >= 24`.
- R-init-04: `tsconfig.json` — `module` + `moduleResolution` = `NodeNext`, `types: ["node"]`; local imports in `src/` without file extensions.
- R-init-03: without `--force`, refuses a non-empty directory (presence of `src/app.ts` or `package.json`).
- R-init-05: `src/main.ts` — on `SIGINT` / `SIGTERM` stops accepting new connections (`server.close()`), waits up to `config.shutdownGraceMs` (default 10 s) for in-flight requests, then forcibly closes remaining connections (`server.closeAllConnections()`); process exits with code `0` on successful close.
- R-init-06: `src/app/logger.ts` — `info` / `error` / `debug`; HTTP code logs through logger, not raw `console` in app middleware and `main.ts`.
- R-init-07: unhandled errors in the request pipeline are logged and answered with JSON `{ error: "Internal Server Error" }` when headers are not sent.
- R-init-08: creates `src/app/config.ts` and `.env.example`; no `dotenv` or `yaml` in generated `package.json` runtime dependencies.
- R-init-09: `loadConfig()` reads `PORT`, `HOST`, `NODE_ENV`, `SHUTDOWN_GRACE_MS`, `CORS_ORIGIN`, `BODY_LIMIT_BYTES`, `BEARER_TOKEN` with defaults `3000`, `0.0.0.0`, `development`, `10000`, empty, `1048576`, empty; invalid `PORT`, `NODE_ENV`, or `BODY_LIMIT_BYTES` throws before the server listens.
- R-init-10: optional `.env` in the process cwd — `KEY=VALUE` lines; does not override variables already set in `process.env`; missing file is not an error.
- R-init-11: `init --force` does not overwrite an existing `.env`.
- R-init-12: `POST`/`PUT`/`PATCH` with `Content-Length` over `BODY_LIMIT_BYTES` (default 1 MiB) → `413` `{ error: "Request body too large" }`; `readJson` also rejects bodies that exceed the limit without `Content-Length`.
- R-init-13: when `CORS_ORIGIN` is set (`*` or comma-separated origins), matching `Origin` is reflected and `OPTIONS` is answered `204`; when unset, no CORS headers.
- R-init-14: when `BEARER_TOKEN` is set, requests other than `OPTIONS` and `GET /health` require `Authorization: Bearer <token>` or `401` `{ error: "Unauthorized" }`; when unset, bearer middleware is a no-op.
- R-init-15: `src/app/list.ts` exports `ListQuery` and `parseListQuery`; defaults `limit=50`, `offset=0`; `limit` must be 1..100.
- R-init-16: `aether init --dry-run` exits 0 and does not write scaffold files to the target directory.

## Out of scope

- ORM, Docker, migrations, generated SQL or in-memory stores in `src/`.
- Application YAML/JSON config files, `dotenv`, zod/ajv validation libraries, layered config files.
- Per-route auth, cookie sessions, CORS credentials.
