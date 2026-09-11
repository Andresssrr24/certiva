import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { preparePrivateDirectory } from "../scripts/private-directory.mjs";

const run = promisify(execFile);
test("provisioning rejects renamed repositories, worktrees and symlinks into them", async () => {
  const root = await mkdtemp(join(tmpdir(), "certiva-private-path-"));
  try {
    const repo = join(root, "arbitrary-repository-name");
    await mkdir(repo);
    await run("git", ["init", "-q", repo]);
    await assert.rejects(preparePrivateDirectory(join(repo, "private")), /outside any Git repository/);
    await run("git", [
      "-C",
      repo,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "--allow-empty",
      "-qm",
      "fixture",
    ]);
    const worktree = join(root, "separate-worktree");
    await run("git", ["-C", repo, "worktree", "add", "--detach", worktree]);
    await assert.rejects(preparePrivateDirectory(join(worktree, "private")), /outside any Git repository/);
    const alias = join(root, "alias");
    await symlink(repo, alias);
    await assert.rejects(preparePrivateDirectory(join(alias, "private")), /outside any Git repository/);
    const privatePath = await preparePrivateDirectory(join(root, "outside"));
    assert.equal((await stat(privatePath)).mode & 0o777, 0o700);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
