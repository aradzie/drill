import { build } from "rolldown";

// Bundles the server with all its dependencies, including the build-less
// `shared` workspace package, into a single ES module `app/index.js`, so
// `app/` runs standalone without `node_modules`.
await build({
  input: "src/cli.ts",
  platform: "node",
  output: {
    file: "../app/index.js",
    format: "esm",
    codeSplitting: false,
    sourcemap: true,
  },
});
