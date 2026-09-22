# middleware

## Command and flags

- `aether generate middleware <name>` / `aether g middleware <name>`
- `--global` — register in `src/app.ts` global `middleware` array
- `--force`, `--dry-run`

## Preconditions

- Project initialized with Aether (`package.json` + `src/app.ts`).

## Named recipes

- `request-id` — ready-made middleware (not a passthrough stub). Other names still use the generic stub (R-middleware-01).

## Created files

- `src/app/middleware/<name>.ts` (kebab-case name)

## Modified files

- With `--global` only: `src/app.ts` — import middleware; entry in the `middleware` array.

## Idempotency

- Regenerating the same name: no duplicate import or array entry; without `--force` — error if the file exists.

## Acceptance criteria

- R-middleware-01: creates passthrough middleware with `next()` and a TODO.
- R-middleware-02: with `--global`, registers middleware in `src/app.ts`.
- R-middleware-03: a second run does not duplicate registration (with `--global`).
- R-middleware-04: without `--global`, creates the middleware file only; `src/app.ts` is unchanged.
- R-middleware-05: `g middleware request-id` creates middleware that preserves a non-empty incoming `X-Request-Id`, otherwise assigns `randomUUID()`, sets response header `X-Request-Id`, and calls `next()` (no TODO stub).
- R-middleware-06: `g middleware request-id --global` registers `requestIdMiddleware` in `src/app.ts` **before** `requestLogger` (not appended after bearer). Generic `--global` middleware still appends to the end of the chain.
- R-middleware-07: init `request-logger.ts` includes `requestId` in log metadata when `x-request-id` is present on the request. HTTP: `GET /health` response includes non-empty `X-Request-Id`; request with `X-Request-Id: test-correlation` echoes the same value in the response header.

## Out of scope

- Per-route middleware.
- Replacing init CORS / body-limit / bearer middleware.
- Auto-migrating user-edited `request-logger.ts` in existing projects; only new `init` scaffolds include request-id log metadata.
- Other named recipes (`rate-limit`, `timeout`) in this change.
