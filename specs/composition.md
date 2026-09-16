# composition

## Purpose

Generated apps wire HTTP resources through an explicit composition root. No DI container; the user connects repository implementations in one file.

## Files

- `src/app/composition.ts` — created by `init`; extended by `g resource` / `g openapi`.

## Behavior

- `buildAppRoutes()` returns all application routes (health + resource modules).
- Each CRUD resource module is created via `create<Entity>Module({ repository?: ... })`.
- When `repository` is omitted, CRUD handlers respond with **501** and JSON `{ error: "Repository not configured" }`.
- Repository types are **interfaces only** in `*.repository.ts`; implementations are user-owned.

## Modified files

- `src/app/composition.ts`: import module factory; append module routes in `buildAppRoutes()` (idempotent).

## Acceptance criteria

- R-composition-01: `g resource users --crud` registers `createUsersModule({})` routes without duplicate imports on repeat (repeat fails on existing dir, not duplicate wiring).
- R-composition-02: CRUD endpoints return 501 until user passes a repository implementation into the module factory call.
- R-composition-03: wiring changes only `composition.ts`, not scattered singleton imports in service/controller.

## Out of scope

- Auto-discovery of repository implementations, ORM adapters, runtime Aether.
