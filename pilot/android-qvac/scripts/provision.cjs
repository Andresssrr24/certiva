// Debug builds only. Select an explicit device; no user messages or private files are read.
const fs = require("node:fs");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const [serial, apk, model, packageName = "local.certiva.pilot"] = process.argv.slice(2);
if (!serial || !apk || !model || !/^local\.certiva\.[a-z]+$/.test(packageName)) {
  console.error("node provision.cjs SERIAL APK MODEL.gguf [local.certiva.qvacprobe]");
  process.exit(1);
}
const adb = process.env.ADB || "adb";
const expected = "b139949c5bd74937ad8ed8c8cf3d9ffb1e99c866c823204dc42c0d91fa181897";
const run = (...args) => execFileSync(adb, ["-s", serial, ...args], { stdio: "inherit" });
(async () => {
  const hash = crypto.createHash("sha256");
  for await (const chunk of fs.createReadStream(model)) hash.update(chunk);
  if (hash.digest("hex") !== expected) throw Error("Model checksum mismatch");
  const state = execFileSync(adb, ["-s", serial, "get-state"], { encoding: "utf8" }).trim();
  if (state !== "device") throw Error("Authorize USB debugging first");
  const remoteApk = "/data/local/tmp/certiva-install.apk";
  run("push", "-Z", apk, remoteApk);
  run("shell", "pm", "install", "-r", remoteApk);
  run("shell", "rm", remoteApk);
  const remote = "/data/local/tmp/certiva-qwen3.gguf";
  run("push", "-Z", model, remote);
  run("shell", `run-as ${packageName} mkdir -p files/qvac`);
  run("shell", `run-as ${packageName} cp ${remote} files/qvac/Qwen3-1.7B-Q4_K_M.gguf`);
  const output = execFileSync(
    adb,
    ["-s", serial, "shell", `run-as ${packageName} sha256sum files/qvac/Qwen3-1.7B-Q4_K_M.gguf`],
    { encoding: "utf8" },
  );
  if (!output.startsWith(expected + " ")) throw Error("Device model checksum mismatch");
  run("shell", `run-as ${packageName} sh -c 'echo ${expected} > files/qvac/verified.sha256'`);
  run("shell", "rm", remote);
  console.log("APK and verified model installed. No Mac connection is required for inference.");
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
