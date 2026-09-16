# AGENTS.md — Chisel CLI

## Core invariant

Chisel is a **source code scaffolding** tool, not a runtime framework. The generated application runs without Chisel installed. No template under `templates/` may add `chisel` to `dependencies` or dependency-like fields in the generated `package.json`.

## Commands

```bash
npm install
npm run build
npm test
npm run dev -- init
npm run dev -- g resource users --crud
```

## Rules for `templates/`

- Generated app: **CommonJS** (no `"type": "module"`). Local imports **without** file extensions (`./app/server`); keep `node:*` as-is. `tsconfig`: `module` + `moduleResolution` = `NodeNext`, `types: ["node"]` (TS 7).
- Zero runtime dependencies: no third-party packages in `dependencies`.
- No decorators, DI containers, metadata, or hidden magic.
- Minimal, readable code; the user edits files by hand.

## Rules for `src/generators/`

- A generator returns only `FileOp[]`; it does not write to disk itself.
- Modifying existing files uses `modify` + ts-morph; operations must be **idempotent**.
- Naming: kebab-case for paths, PascalCase for types, camelCase for variables.

## Workflow

1. Spec in `specs/` (contract, not implementation).
2. Test with criterion ID (`R-<generator>-NN` in the `it(...)` title).
3. Code.

Behavior changes without updating the spec in the same change are not accepted.

## Documentation

- `AGENTS.md` and `specs/` are for CLI development; they are not published in the npm package (`files: ["dist"]`).
- `README.md` is the npm listing. Keep it short.
