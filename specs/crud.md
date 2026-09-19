# crud

## Command and flags

- `aether g resource <name> --crud`

## Preconditions

- Same as resource.

## Schema

- Manual `g resource --crud` generates an **empty** domain schema: entity type has only `id`; create accepts `{}`; update returns validation error `No update fields configured` until the user edits types/validate.
- Typed domain fields are generated automatically only via `aether g openapi <spec>`.

## List query

- Collection `GET` accepts `limit` and `offset` query params, parsed by `parseListQuery` from `src/app/list.ts`.
- `*.repository.ts` `findAll(query: ListQuery)`; service `list` forwards the query.
- Invalid query → `400`. Missing params use defaults from `parseListQuery`.

## Created files

- Same as resource, with CRUD handlers, module factory, and repository **interface**.

## Endpoints

- `GET /{name}`
- `GET /{name}/:id`
- `POST /{name}`
- `PATCH /{name}/:id`
- `DELETE /{name}/:id`

## Behavior without repository

- Module is registered as `create<Entity>Module({})` (no repository).
- All CRUD handlers respond **501** with `{ error: "Repository not configured" }`.

## Acceptance criteria

- R-crud-01: `*.repository.ts` exports only a repository interface (no class/function implementation in that file).
- R-crud-02: controller returns 404 for missing id when repository is wired; 400 for invalid JSON/body (body rules in `*.validate.ts`); 501 when repository is not wired.
- R-crud-04: `*.validate.ts` exports `parseCreateInput` / `parseUpdateInput`; controller does not embed field guards.
- R-crud-03: all five endpoints are registered in routes.
- R-crud-05: manual `--crud` without OpenAPI produces entity `{ id: string }` only.
- R-crud-06: `findAll` / `list` take `ListQuery`; collection handler calls `parseListQuery`.

## Out of scope

- Total count, cursor pagination, filters, persistence adapters, CLI field DSL.
