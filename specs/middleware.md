# middleware

## Command and flags

- `chisel generate middleware <name>` / `chisel g middleware <name>`
- `--force`, `--dry-run`

## Preconditions

- Project initialized with Chisel (`package.json` + `src/app.ts`).

## Created files

- `src/app/middleware/<name>.ts` (kebab-case name)

## Modified files

- `src/app.ts`: import middleware; entry in the `middleware` array.

## Idempotency

- Regenerating the same name: no duplicate import or array entry; without `--force` — error if the file exists.

## Acceptance criteria

- R-middleware-01: creates passthrough middleware with `next()` and a TODO.
- R-middleware-02: registers middleware globally in `src/app.ts`.
- R-middleware-03: a second run does not duplicate registration.

## Out of scope

- Per-route middleware, auth logic.
