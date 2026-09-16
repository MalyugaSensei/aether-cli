# routes-registration

## Description

Automatic registration of resource modules in `src/app/composition.ts`.

## Modified files

- `src/app/composition.ts`
  - `import { createUserModule } from "../users/users.module";` (example)
  - `buildAppRoutes()` return array: add `...createUserModule({}).routes`

## Idempotency

- R-routes-registration-01: a second run for the same resource does not add a duplicate import or duplicate spread in the array.

## Out of scope

- Dynamic module loading.
