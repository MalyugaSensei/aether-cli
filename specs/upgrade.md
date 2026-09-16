# upgrade

## Command and flags

- `aether upgrade --dry-run`

## Behavior

- Reports whether the project matches the current Aether init/composition contract (read-only).
- Does not write files in `--dry-run`.

## Acceptance criteria

- R-upgrade-01: detects missing `src/app/composition.ts` and suggests re-init or manual restore.

## Out of scope

- Automatic migration of user-edited files without review.
