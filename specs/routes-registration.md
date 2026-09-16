# routes-registration

## Description

Automatic registration of resource routes in `src/app.ts`.

## Modified files

- `src/app.ts`
  - `import { <name>Routes } from "./<name>/<name>.routes.js";`
  - `routes` array: add `...<name>Routes`

## Idempotency

- R-routes-registration-01: a second run for the same resource does not add a duplicate import or duplicate spread in the array.

## Out of scope

- Dynamic module loading.
