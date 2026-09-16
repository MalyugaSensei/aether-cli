# aether-cli

Scaffold Node.js HTTP backends in TypeScript. Generated apps run without Aether and have zero runtime dependencies.

Requires Node.js 20+.

```bash
npm i -g aether-cli

mkdir my-api && cd my-api
aether init
npm install
aether g resource users --crud
npm run dev
```

```bash
aether help
```
