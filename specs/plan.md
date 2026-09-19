# plan

## Description

File operations from generators are collected as `FileOp[]`, previewed, then applied atomically via `materializePlan` / `commitPlan`.

## Flags (commands)

- `--dry-run` — print the plan without writing (see `init`, `g resource`, etc.).

## Acceptance criteria

- R-plan-01: `commitPlan` with `dryRun: true` does not create or modify files on disk.
- R-plan-02: if a `modify` operation fails after successful `create` operations in the same plan, previously created files from that plan are removed (no partial apply).

## Out of scope

- Interactive merge UI, three-way diff.
