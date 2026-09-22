# resource

## Command and flags

- `aether generate resource <name>` / `aether g resource <name>`
- `--crud`, `--singular <name>`, `--tests`, `--force`, `--dry-run`

## Preconditions

- Project initialized with Aether (`src/app/composition.ts` present).

## Created files

- `src/<name>/<name>.types.ts`
- `src/<name>/<name>.validate.ts` (with `--crud` only)
- `src/<name>/<name>.repository.ts` (interface with `--crud`)
- `src/<name>/<name>.service.ts`
- `src/<name>/<name>.controller.ts`
- `src/<name>/<name>.routes.ts`
- `src/<name>/<name>.module.ts`
- With `--tests` and `--crud`: `tests/<name>.repository.fake.ts`, `tests/<name>.module.test.ts`, `tests/<name>.http.test.ts`

## Modified files

- `src/app/composition.ts`: import module factory; spread module routes in `buildAppRoutes()`.

## Idempotency

- Repeat for the same resource: no duplicate composition wiring; without `--force` — error if the directory exists.
- If the resource directory already exists and only `--tests` is requested (no `--force`): add files under `tests/` only; do not modify `src/` or composition.

## Acceptance criteria

- R-resource-01: creates the chain module → routes → controller → service → repository (with `--crud`: includes `*.validate.ts`).
- R-resource-02: routes are wired into `src/app/composition.ts` automatically.
- R-resource-03: a second run does not duplicate import or route registration.
- R-resource-04: on an existing CRUD resource, `g resource <name> --tests` creates test files only; rejects non-CRUD resources.
- R-resource-05: with `--crud --tests`, creates `tests/<name>.http.test.ts` in addition to fake repository and module unit test files.
- R-resource-06: HTTP smoke wires a fake repository via `create<Entity>Module({ repository: ... })` and `createApp({ routes })` only; does not modify `src/app/composition.ts`. Exercises create → list → get → delete over HTTP; includes PATCH only when the resource has at least one updatable field (OpenAPI-derived fields).

## Out of scope

- ORM, third-party validation libraries (hand-rolled checks live in `*.validate.ts` for replacement).
- CLI `--field` DSL; use OpenAPI or edit generated sources.
