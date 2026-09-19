# openapi

## Command and flags

- `aether generate openapi <spec>` / `aether g openapi <spec>`
- `--force`, `--dry-run`, `--strict`, `--only <names>` (comma-separated)

## Preconditions

- Project initialized with Aether.
- OpenAPI **3.0.x** document (JSON or YAML).

## Behavior

- Detect REST collections: path `/{resource}` or `/{prefix}/{resource}` plus matching `.../{param}` item path (any `{param}` name).
- Entity fields from `POST` `requestBody` `application/json` schema; merge optional fields from item `PATCH` or `PUT` body.
- Maps OpenAPI types: `string`, `number`, `integer`, `boolean`, `enum` (as string).
- Resolves `$ref` only when target is `#/components/schemas/{Name}`.
- Skipped paths are logged to stderr; with `--strict`, any skip fails the command.
- `--only` filters generated resources by collection name.

## Created / modified files

- Same as [resource](./resource.md) + [crud](./crud.md) per detected resource.
- `src/app/composition.ts`: register each resource module (idempotent).

## Idempotency

- Existing **CRUD** resource without `--force`: rewrite `*.types.ts` and `*.validate.ts` from the spec (schema sync). Do not rewrite service, controller, routes, module, or repository.
- Existing **non-CRUD** resource directory without `--force`: error; use `--force` to replace the module.
- `--force`: overwrite the full resource stack.

## Acceptance criteria

- R-openapi-01: parses JSON and YAML specs.
- R-openapi-02: generates a CRUD resource with fields from the POST schema.
- R-openapi-03: second run without `--force` updates types and validate from the spec.
- R-openapi-04: skips collections that lack item path or POST body schema (or errors in `--strict`).
- R-openapi-07: `$ref` to component schema resolves to fields.
- R-openapi-08: multiple resources in one spec.
- R-openapi-09: second run without `--force` does not rewrite service, controller, routes, module, or repository.
- R-openapi-10: `--force` overwrites the full resource module.

## Out of scope

- OpenAPI code generation for arbitrary operations, security schemes, multipart, non-JSON bodies, external `$ref`, OpenAPI 3.1.
- Merging hand-edited fields in types/validate with the spec (spec wins on those two files).
