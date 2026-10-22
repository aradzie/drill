#!/usr/bin/env node
import { parseArgs } from "node:util";
import { serve } from "./server.ts";
import { installService, uninstallService } from "./service.ts";

const HELP = `drill — spaced-repetition review app

Usage:
  drill [serve] [options]        Start the web server (default command)
  drill service install [options]   Install a systemd --user service
  drill service uninstall           Remove the systemd --user service
  drill --help                      Show this help

Options for "serve" / "service install":
  --port <n>   Port to listen on (default: 3000, or $PORT)
  --host <h>   Host to bind to (default: 0.0.0.0)

Options for "service install":
  --enable     Also run "systemctl --user enable --now" immediately
`;

function fail(message: string) {
  console.error(`${message}\n`);
  console.log(HELP);
  process.exitCode = 1;
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    host: { type: "string", default: "0.0.0.0" },
    port: { type: "string", default: process.env["PORT"] ?? "3000" },
    enable: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

const [command = "serve", subcommand, ...rest] = positionals;
const port = Number(values.port);

if (values.help) {
  console.log(HELP);
} else if (!Number.isInteger(port) || port < 0 || port > 65535) {
  fail(`Invalid port: ${values.port}`);
} else if (command === "serve" && subcommand == null) {
  await serve({ port, host: values.host });
} else if (command === "service" && subcommand === "install" && rest.length === 0) {
  installService({ port, host: values.host, enable: values.enable });
} else if (command === "service" && subcommand === "uninstall" && rest.length === 0) {
  uninstallService();
} else {
  fail(`Unknown command: ${positionals.join(" ")}`);
}
