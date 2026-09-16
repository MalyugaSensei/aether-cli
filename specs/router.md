# router

## Description

Minimal HTTP router in the generated app (`src/app/router.ts`).

## Behavior

- Match method + path; `:param` → RegExp, decode URI component.
- Trailing slash: normalize (no trailing slash for matching).
- More specific static segments do not conflict with a param at the same level (route registration order).

## Acceptance criteria

- R-router-01: extracts path params and applies decodeURIComponent.
- R-router-02: 404 when there is no match.
- R-router-03: empty/invalid JSON body is handled in http helpers (used by controllers).

## Out of scope

- Per-route middleware, wildcard routes.
