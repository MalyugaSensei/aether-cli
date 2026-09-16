# crud

## Command and flags

- `chisel g resource <name> --crud`

## Preconditions

- Same as resource.

## Created files

- Same as resource, with full CRUD logic.

## Endpoints

- `GET /{name}`
- `GET /{name}/:id`
- `POST /{name}`
- `PATCH /{name}/:id`
- `DELETE /{name}/:id`

## Acceptance criteria

- R-crud-01: repository — in-memory Map + `randomUUID()`.
- R-crud-02: controller returns 404 for missing id, 400 for invalid JSON/body.
- R-crud-03: all five endpoints are registered in routes.

## Out of scope

- Pagination, filters, persistence.
