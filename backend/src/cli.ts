#!/usr/bin/env node
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

function parseArgs(argv: string[]) {
  const args = [...argv];
  let command = "serve";
  let subcommand: string | undefined;

  if (args[0] && !args[0].startsWith("-")) {
    command = args.shift()!;
  }
  if (command === "service" && args[0] && !args[0].startsWith("-")) {
    subcommand = args.shift();
  }

  let port = Number(process.env.PORT) || 3000;
  let host = "0.0.0.0";
  let enable = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--port") {
      port = Number(args[++i]);
    } else if (arg === "--host") {
      host = args[++i];
    } else if (arg === "--enable") {
      enable = true;
    } else if (arg === "--help" || arg === "-h") {
      command = "help";
    }
  }

  return { command, subcommand, port, host, enable };
}

async function main() {
  const { command, subcommand, port, host, enable } = parseArgs(process.argv.slice(2));

  if (command === "help") {
    console.log(HELP);
    return;
  }

  if (command === "serve") {
    await serve({ port, host });
    return;
  }

  if (command === "service") {
    if (subcommand === "install") {
      installService({ port, host, enable });
      return;
    }
    if (subcommand === "uninstall") {
      uninstallService();
      return;
    }
    console.error(`Unknown service subcommand: ${subcommand ?? "(none)"}\n`);
    console.log(HELP);
    process.exitCode = 1;
    return;
  }

  console.error(`Unknown command: ${command}\n`);
  console.log(HELP);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
