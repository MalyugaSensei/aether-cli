# @malyuga/aether-cli

Aether scaffolds **plain TypeScript** HTTP backends on Node’s built-in `http` module. It writes source files you own and edit by hand—it is not a runtime framework. After generation, your app runs with **no Aether dependency** and **no npm packages in `dependencies`**.

Requires **Node.js 20+**.

## Why Aether?

Starting from an empty directory means rebuilding the same server, routing, configuration, and error handling every time. Starting from a framework means adopting its runtime, conventions, and upgrade path.

Aether takes the middle ground: it generates a small, working backend and then gets out of the way. The result is ordinary TypeScript with explicit wiring, replaceable parts, and no framework-specific runtime. You can keep the generated structure, change it, or remove any part of it without fighting the tool.

## Quick start

```bash
npm i -g @malyuga/aether-cli

mkdir my-api && cd my-api
aether init
npm install
aether g resource users --crud
npm run dev
```

`GET /health` works immediately. CRUD routes are wired in `src/app/composition.ts`, but the generated **repository is only an interface**—until you pass a real implementation there, CRUD handlers respond with **501 Repository not configured**. That is intentional: persistence is your code, not generated magic.

Typical next step: implement `UserRepository` (or use the optional fake from `aether g resource users --crud --tests`) and pass it into `createUserModule({ repository: … })` in `composition.ts`.

## What `init` gives you

- **HTTP server** with graceful shutdown (`SIGINT` / `SIGTERM`)
- **Router** and a single **composition root** (`src/app/composition.ts`) where modules and repositories are wired
- **Config from environment** (`.env` parsed without `dotenv`); see `.env.example`
- **Middleware**: CORS, body size limit, request logging, centralized errors, optional **Bearer** auth via `BEARER_TOKEN` in `.env` (disabled when unset; `GET /health` stays public)
- **`GET /health`** → `{ "status": "ok" }`
- **List helper** for collection endpoints: `?limit=1..100&offset=0` (default limit 50)

Output is **CommonJS**; local imports omit file extensions. Production path: `npm run build` then `npm start` (`node dist/main.js`)—runtime needs only Node, not TypeScript or tsx.

## Commands

| Command | Purpose |
|--------|---------|
| `aether init` | Scaffold a new project in the current directory |
| `aether g resource <name>` | Resource module (add `--crud` for full stack) |
| `aether g middleware <name>` | Middleware stub (`--global` registers in `src/app.ts`) |
| `aether g openapi <spec>` | Generates CRUD resources from an OpenAPI specification |
| `aether check` | Verify layout (`composition`, config) |
| `aether doctor` | Node version, project context, CLI templates |
| `aether upgrade` | Reports how the project drifts from the current Aether contract; read-only, does not rewrite your code |
| `aether help` | Full guide with examples |

`generate` is aliased as **`g`**.

### Useful flags

- **`--dry-run`** — show planned creates/modifies without writing
- **`--diff`** — with `--dry-run`, print a unified diff
- **`--json`** — machine-readable output (including errors)
- **`--force`** — overwrite existing generated files (`init` never overwrites `.env`)

Resource-specific: `--crud`, `--singular`, `--tests` (with `--crud`: fake repo + smoke tests under `tests/`). OpenAPI: `--strict`, `--only a,b`.

## Examples

Preview scaffold before writing:

```bash
aether init --dry-run --diff
```

CRUD and tests in one step:

```bash
aether g resource orders --crud --tests
```

Generate from an API contract (re-run updates **types** and **validate** only; use `--force` to rewrite the whole module):

```bash
aether g openapi ./api.yaml --strict
```

Enable Bearer auth on all routes except health (already wired by `init`; set the token in `.env`):

```bash
BEARER_TOKEN=your-secret
```

CI-style structure check:

```bash
aether check --json
```

## Resource layout (with `--crud`)

For `users` you get layers under `src/users/`:

`types` → `validate` → `repository` (interface) → `service` → `controller` → `routes` → `module`, plus registration in `composition.ts`.

Without OpenAPI, a manual CRUD resource starts with entity **`{ id }`** only—you extend types and validation yourself, or import fields from OpenAPI.

For the full command reference and notes, run **`aether help`**.

## License

MIT
