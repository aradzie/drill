# Development guide

Use this file for design constraints, development commands, coding conventions, and tool troubleshooting.

- [PROJECT.md](PROJECT.md) describes the project's purpose, user-facing features, and scope.
- [Writing problem files](docs/content.md) explains the problem-authoring format.

## Design constraints

- **Content ownership and identity:** Problem content is maintained outside Drill; the app reads it without modifying it. Keep IDs stable when editing or moving problems. Removing content does not erase its history; restoring the same ID reconnects it.
- **Authoritative history:** Derive study state and schedules by replaying recorded actions in stored order, even when timestamps tie or decrease. Browser and server share domain logic. Scheduler changes affect existing history and schedules, not just future reviews.
- **Work and scheduling:** Starting or stopping work preserves the existing schedule. Reviewing ends open work and updates scheduling. Graduation removes a problem from automatic review while keeping it available for manual practice.
- **Server authority:** Validate actions against committed history and report success only after saving. Preserve command identity for retry deduplication and expected-state checks to reject stale actions. These protections do not synchronize browser views; activity recorded elsewhere currently requires a reload.
- **One writer:** A single server owns the local JSONL history file. Atomic replacement protects against partial file replacement, but does not coordinate multiple writers. Concurrent servers or external edits during a save can lose changes.
- **Local calendar time:** Scheduling uses local calendar days. Server and browser have no enforced common timezone, so timezone changes can affect derived dates.

## Commands

Run these from the repository root. The root scripts delegate to the npm workspaces.

| Command                             | Purpose                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `npm install`                       | Install workspace dependencies                                            |
| `npm run dev:frontend`              | Start the Vite development server                                         |
| `npm run dev:backend`               | Run the backend directly with Node's native TypeScript support            |
| `npm run build`                     | Build frontend, then backend                                              |
| `npm run build:frontend`            | Run `tsc -b` and Vite; output to `app/public/`                            |
| `npm run build:backend`             | Run the esbuild build script; output `app/index.js` and its source map    |
| `npm run typecheck`                 | Check shared and frontend with `tsc -b`, then backend with `tsc --noEmit` |
| `npm test`                          | Run workspace tests where a test script exists                            |
| `npm start`                         | Run the bundled app; build first                                          |
| `npm run format`                    | Format the repository with oxfmt                                          |
| `npm run lint`                      | Run root ESLint checks                                                    |
| `npm run lint-fix`                  | Apply root ESLint fixes                                                   |
| `npm run lint --workspace frontend` | Run the separate frontend oxlint checks                                   |
| `npm run stylelint`                 | Check frontend CSS                                                        |
| `npm run stylelint-fix`             | Apply frontend CSS lint fixes                                             |
| `npm run service:install`           | Install and enable the systemd user service; build first                  |
| `npm run service:uninstall`         | Stop, disable, and remove the systemd user service                        |

The frontend and backend development servers run separately. For the combined app, run `npm run build` followed by `npm start`.

The backend needs no tsx or ts-node runner. Use `node backend/src/cli.ts --help` for CLI options; running it with no arguments or with `serve` starts the server. The CLI supports `--port` and `--host`.

## Tests and validation

Tests use Node's built-in test runner (`node:test` and `node:assert/strict`). Shared, frontend, and backend each have a test script. Backend tests set `DB_PATH=:memory:` to disable filesystem persistence by default. Persistence tests use isolated temporary directories and remove them afterward.

Run individual files directly when validating a narrow change:

```bash
node --test shared/src/types.test.ts
node --test frontend/src/rich-text/format-field.test.ts
DB_PATH=:memory: node --test backend/src/problems/load.test.ts
```

Run the checks appropriate to the files changed. Use `git diff --check` to catch whitespace errors. Format edited files with oxfmt; the root `npm run format` command formats the whole repository, while `npx oxfmt --write <files>` scopes it to selected files.

## Manual and browser testing

To exercise the running app (not just the test suite), start the backend and frontend dev servers separately, as in "Commands" above. Always set `DB_PATH=:memory:` for a manually launched backend: the default path is `~/Documents/Problems/reviews.jsonl`, real review history, not a fixture. Never launch the backend for exploratory testing without overriding `DB_PATH`. Problem content itself is loaded read-only from `~/Documents/Problems` and is safe to read against.

```bash
DB_PATH=:memory: node backend/src/cli.ts --port 3000 &
npm run dev:frontend &   # proxies /api to localhost:3000; serves on 5173
```

There is no `chromium-cli` or project-specific browser-driving skill in this environment. To screenshot or click through the UI, bootstrap Playwright in the scratchpad directory rather than the repo (`npm init -y && npm install playwright && npx playwright install chromium`), then drive it with a small script using `chromium.launch({ args: ['--no-sandbox'] })`. The Chromium download may print "OS not officially supported... downloading fallback build" on this host; that's expected and the fallback build works.

## Editing and coding conventions

- `app/` contains generated build artifacts except for its hand-written `package.json`. Edit source files, not `app/index.js`, its source map, or `app/public/`.
- Use TypeScript compatible with the repository's native Node execution and `erasableSyntaxOnly` configuration. Follow existing `.ts` import conventions.
- Keep the existing modern runtime/browser targets. Do not add legacy transpilation or polyfills.
- Style components with CSS Modules. Reuse existing widget wrappers.
- Use logical CSS properties and keywords: for example, `inline-size` and `margin-inline-start`.
- Do not use `px`. Express lengths as whole numbers of `rem`, such as `1rem` and `2rem`.
- Do not add manual `useMemo` or `useCallback`; write plain functions and values for the React Compiler to memoize.
- Keep design documentation focused on intent, decisions, and constraints. Put implementation details and behavioral edge cases in code comments and tests; avoid duplicating function signatures, source inventories, or UI walkthroughs in prose.

## Formatting and lint tools

oxfmt is the formatting authority, including for CSS. Linters do not replace formatting.

Root `eslint.config.js` checks workspace JS/TS and ignores generated `app/**` output. The local `eslint-plugin-custom.js` checks that relative import paths resolve and can fix an obsolete path when there is one unambiguous same-basename match. Import ordering uses `simple-import-sort`.

Frontend oxlint (`frontend/.oxlintrc.json`) is separate from root ESLint and adds React/oxc checks. Stylelint checks `frontend/**/*.css`; `.stylelintrc.js` includes the logical-CSS rules.

## React Compiler troubleshooting

`frontend/vite.config.ts` enables the compiler through the Vite React plugin's native oxc integration, `react({ compiler: { logDiagnostics: true } })`. Do not replace this with the Babel compiler plugin.

Keep `oxc-transform-react` as a root devDependency. The hoisted Vite React plugin imports it from its own location; declaring it only in the frontend workspace previously made the build fail with a missing-package error.

The repository's troubleshooting notes record that `try`/`finally` inside a component or hook can cause the compiler to skip it without diagnostics. Avoid that pattern in provider/hook code; reset state explicitly on both success and catch paths. It previously caused an infinite fetch loop when an effect depended on a local function whose identity was no longer stabilized.

If an effect depending on a local function runs unexpectedly often, inspect compilation before adding manual memoization. Use `oxc-transform-react`'s `transformSync` or inspect the built output for `useMemoCache` calls. The `react-hooks/exhaustive-deps` lint result alone does not establish whether compilation succeeded.
