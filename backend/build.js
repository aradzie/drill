import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// esbuild's CJS output leaves `import.meta.url` empty (it only works for ESM
// output) — this inject+define pair replaces it with a CJS-native
// equivalent, matching what tsup's `shims: true` used to do.
const importMetaUrlShim = fileURLToPath(new URL("./scripts/import-meta-url-shim.js", import.meta.url));

await build({
  entryPoints: { index: "src/cli.ts" },
  bundle: true,
  platform: "node",
  // CJS, not ESM: some bundled deps (transitively under @fastify/static)
  // call require() internally in ways esbuild can't statically resolve into
  // an ESM import, which throws at runtime ("Dynamic require of ... is not
  // supported") once those deps are inlined. CJS output has a native
  // require, so this is moot there.
  format: "cjs",
  target: "node22",
  outdir: "../app",
  // Bundle every dependency into app/index.cjs — "shared" is a workspace
  // package with no build step of its own, and fastify/@fastify/static are
  // bundled too so app/ is a standalone artifact that runs with no
  // node_modules alongside it, wherever it's copied to. esbuild bundles
  // everything by default (unlike tsup, which treats package.json
  // "dependencies" as external unless told otherwise), so no explicit
  // external/noExternal list is needed.
  inject: [importMetaUrlShim],
  define: { "import.meta.url": "import_meta_url" },
  sourcemap: true,
});
