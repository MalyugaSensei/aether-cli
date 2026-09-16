# openapi

## Command and flags

- `chisel generate openapi <spec>` / `chisel g openapi <spec>`
- `--force`, `--dry-run`

## Preconditions

- Project initialized with Chisel.
- OpenAPI **3.0.x** document (JSON or YAML).

## Behavior

- Detect REST collections: path `/{resource}` plus `/{resource}/{id}` (path parameter **must** be named `id`).
- Supported methods on collection: `GET` (list), `POST` (create).
- Supported methods on item: `GET` (getById), `PATCH` or `PUT` (update), `DELETE` (remove).
- Entity fields from `POST` `requestBody` `application/json` schema (`properties` + `required`). Always adds `id: string` on the entity type. Maps OpenAPI types: `string`, `number`, `integer`, `boolean`.
- Resolves `$ref` only when target is `#/components/schemas/{Name}`.
- Skips paths that do not match the pattern; generates one resource module per valid collection (same output as `g resource <name> --crud` with derived fields).

## Created / modified files

- Same as [resource](./resource.md) + [crud](./crud.md) per detected resource.
- `src/app.ts`: register each resource’s routes (idempotent).

## Idempotency

- Same as resource: existing resource directory without `--force` fails.

## Acceptance criteria

- R-openapi-01: parses JSON and YAML specs.
- R-openapi-02: generates a CRUD resource with fields from the POST schema.
- R-openapi-03: registers routes in `src/app.ts` without duplicates on a second spec with one resource.
- R-openapi-04: rejects or skips collections that lack `{id}` item path or POST body schema.

## Out of scope

- OpenAPI code generation for arbitrary operations, security schemes, multipart, non-JSON bodies, `$ref` beyond component schemas.
