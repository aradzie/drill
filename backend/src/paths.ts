import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM has no native __dirname — derive it from the module's own URL. Bundled
// to a single file (tsup), so this is always the directory the running
// module itself lives in: `app/` in prod, wherever it's been moved to; in
// dev (tsx, running straight from source) it's backend/src/.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `public/` is guaranteed to be a sibling of the bundled module by the build
// (frontend's vite config outputs to `../app/public`). In dev this simply
// won't exist, and server.ts falls back to API-only — the frontend is served
// by the Vite dev server instead.
export const publicDir = path.join(__dirname, "public");
export const problemsDir = path.join(homedir(), "Documents", "Problems");

export const SERVICE_NAME = "drill";

export const cliPath = path.join(__dirname, "index.js");
export const unitDir = path.join(homedir(), ".config", "systemd", "user");
export const unitPath = path.join(unitDir, `${SERVICE_NAME}.service`);
