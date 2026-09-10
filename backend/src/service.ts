import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { cliPath, SERVICE_NAME, unitDir, unitPath } from "./paths.ts";

export type ServiceInstallOptions = {
  port: number;
  host: string;
  enable: boolean;
};

function renderUnit({ port, host }: ServiceInstallOptions): string {
  return `[Unit]
Description=drill — math problem review server
After=network.target

[Service]
ExecStart=${process.execPath} ${cliPath} serve --port ${port} --host ${host}
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
`;
}

function systemctl(...args: string[]) {
  execFileSync("systemctl", ["--user", ...args], { stdio: "inherit" });
}

export function installService(options: ServiceInstallOptions) {
  if (!existsSync(cliPath)) {
    throw new Error(`${cliPath} does not exist.`);
  }

  mkdirSync(unitDir, { recursive: true });
  writeFileSync(unitPath, renderUnit(options));
  console.log(`Wrote ${unitPath}`);

  systemctl("daemon-reload");

  if (options.enable) {
    systemctl("enable", "--now", SERVICE_NAME);
    console.log(`\n${SERVICE_NAME} is enabled and running. Check with: systemctl --user status ${SERVICE_NAME}`);
  } else {
    console.log(`\nTo enable and start it now, run:\n  systemctl --user enable --now ${SERVICE_NAME}`);
  }

  console.log(
    `\nBy default a user service only runs while you're logged in. To let it run after logout / before login, run:\n  loginctl enable-linger ${process.env.USER ?? "$USER"}`,
  );
}

export function uninstallService() {
  if (!existsSync(unitPath)) {
    console.log(`No unit file found at ${unitPath} — nothing to do.`);
    return;
  }

  try {
    systemctl("disable", "--now", SERVICE_NAME);
  } catch {
    // service was already stopped/disabled
  }

  unlinkSync(unitPath);
  systemctl("daemon-reload");
  console.log(`Removed ${unitPath}`);
}
