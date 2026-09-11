import { execFile } from "node:child_process";
import { chmod, mkdir, realpath } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
export async function preparePrivateDirectory(directory) {
  if (!directory) throw new Error("Use a private directory outside any Git repository");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const target = await realpath(directory);
  let repository = false;
  try {
    await run("git", ["-C", target, "rev-parse", "--absolute-git-dir"]);
    repository = true;
  } catch (error) {
    if (error.code !== 128) throw new Error("Cannot verify the private directory; provisioning stopped");
  }
  if (repository) throw new Error("Use a private directory outside any Git repository");
  await chmod(target, 0o700);
  return target;
}
