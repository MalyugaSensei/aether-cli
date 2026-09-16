# help

## Command and flags

- `aether help`
- `--no-color` — plain text (when stdout is a TTY, guide is lightly styled)

## Preconditions

- Packaged `dist/help/guide.txt` exists after `npm run build`, or repo `help/guide.txt` in development.

## Behavior

- Prints the full user guide (quick start, commands, examples).
- `--json` emits `{ ok, guide }` (global `--json`).

## Acceptance criteria

- R-help-01: `aether help` exits 0 and includes quick-start `aether init`.
- R-help-02: built CLI resolves `dist/help/guide.txt`.

## Out of scope

- man pages. User-facing `README.md` is the npm listing, not this command.
