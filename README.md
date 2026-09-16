# chisel-js

Scaffold Node.js HTTP backends in TypeScript. Generated apps run without Chisel and have zero runtime dependencies.

Requires Node.js 20+.

```bash
npm i -g chisel-js

mkdir my-api && cd my-api
chisel init
npm install
chisel g resource users --crud
npm run dev
```

```bash
chisel help
```
