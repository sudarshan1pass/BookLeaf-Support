import { fileURLToPath } from "node:url";
import { spawn as spawnProcess } from "node:child_process";
import { dirname, resolve } from "node:path";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = resolve(repositoryRoot, "node_modules/tsx/dist/cli.mjs");
const viteCli = resolve(repositoryRoot, "node_modules/vite/bin/vite.js");
const serverDirectory = resolve(repositoryRoot, "server");
const clientDirectory = resolve(repositoryRoot, "client");

const children = [
  spawnProcess(process.execPath, [tsxCli, "watch", "src/server.ts"], {
    cwd: serverDirectory,
    stdio: "inherit",
  }),
  spawnProcess(process.execPath, [viteCli, "--host", "0.0.0.0"], {
    cwd: clientDirectory,
    stdio: "inherit",
  }),
];
const allChildrenExited = Promise.all(
  children.map(
    (child) =>
      new Promise((resolveExit) => {
        if (child.exitCode !== null || child.signalCode !== null) {
          resolveExit();
        } else {
          child.once("exit", resolveExit);
        }
      }),
  ),
);

let stopping = false;

function stop(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }

  const timeout = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
    process.exit(exitCode);
  }, 5_000);
  timeout.unref();

  void allChildrenExited.then(() => {
    clearTimeout(timeout);
    process.exit(exitCode);
  });
}

for (const child of children) {
  child.on("error", (error) => {
    console.error("Failed to start a development process:", error);
    stop("SIGTERM", 1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop("SIGTERM", code ?? 1);
  });
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
