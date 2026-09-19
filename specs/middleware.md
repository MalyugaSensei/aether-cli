# middleware

## Command and flags

- `aether generate middleware <name>` / `aether g middleware <name>`
- `--global` — register in `src/app.ts` global `middleware` array
- `--force`, `--dry-run`

## Preconditions

- Project initialized with Aether (`package.json` + `src/app.ts`).

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

## Out of scope

- Per-route middleware.
- Replacing init CORS / body-limit / bearer middleware; `g middleware` still emits a passthrough stub.
