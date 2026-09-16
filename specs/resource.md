# resource

## Command and flags

- `chisel generate resource <name>` / `chisel g resource <name>`
- `--crud`, `--singular <name>`, `--force`, `--dry-run`

## Preconditions

- Project initialized with Chisel.

## Created files

- `src/<name>/<name>.types.ts`
- `src/<name>/<name>.repository.ts`
- `src/<name>/<name>.service.ts`
- `src/<name>/<name>.controller.ts`
- `src/<name>/<name>.routes.ts`

## Modified files

- `src/app.ts`: import routes; spread or concat routes into the `routes` array.

## Idempotency

- Repeat for the same resource: no duplicate import/routes registration; without `--force` — error if the directory exists.

## Acceptance criteria

- R-resource-01: creates the chain routes → controller → service → repository.
- R-resource-02: routes are wired into `src/app.ts` automatically.
- R-resource-03: a second run does not duplicate import or route registration.

## Out of scope

- ORM, validation libraries.
