#!/usr/bin/env node
"use strict";
// Runs the app's native integration test and records only the dedicated test emulator.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync, spawn } = require("node:child_process");
const serial = process.argv[2];
const internal = process.argv[5] === "--ui-internal";
const fixture = internal || process.argv[5] === "--ui-fixture";
if (process.argv[5] && !fixture) throw new Error("Unknown mode");
const apk = process.argv[3] && path.resolve(process.argv[3]);
const output = process.argv[4] && path.resolve(process.argv[4]);
if (!/^emulator-\d+$/.test(serial || "") || !apk || !output || !fs.existsSync(apk)) {
  console.error(
    "Usage: node pilot/scripts/record-android-flow.cjs emulator-5580 /path/app.apk /path/new-output-dir [--ui-fixture|--ui-internal]",
  );
  process.exit(2);
}
if (fs.existsSync(output)) throw new Error("Choose a new output directory to preserve earlier evidence.");
fs.mkdirSync(output, { recursive: true });
const sdk = process.env.ANDROID_HOME || "/opt/homebrew/share/android-commandlinetools";
const adb = process.env.CERTIVA_ADB || path.join(sdk, "platform-tools/adb");
function command(args, optional = false) {
  const r = spawnSync(adb, ["-s", serial, ...args], {
    encoding: "utf8",
    timeout: optional ? 3000 : 20000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (!optional && (r.error || r.status !== 0)) throw new Error(r.error?.message || r.stderr || r.stdout);
  return (r.stdout || "").trim();
}
const token = crypto.randomBytes(8).toString("hex");
const remote = `/sdcard/certiva-flow-${token}.mp4`;
const result = {
  serial,
  startedAt: new Date().toISOString(),
  apkSha256: crypto.createHash("sha256").update(fs.readFileSync(apk)).digest("hex"),
  test: internal
    ? "local.certiva.pilot.UiInternalFlowTest"
    : fixture
      ? "local.certiva.pilot.UiFixtureFlowTest"
      : "local.certiva.pilot.ProtectionFlowTest",
  input: fixture
    ? "Controlled visual fixture; no inference or real WhatsApp delivery. " +
      (internal ? "Internal saved-alert route; no system notification test." : "System notification route.")
    : "Synthetic test alert from ProtectionTest; not a WhatsApp sent between physical phones.",
};
let pid;
(async () => {
  try {
    if (command(["shell", "getprop", "ro.kernel.qemu"]) !== "1") throw new Error("A dedicated emulator is required.");
    const packagePath = command(["shell", "pm", "path", "local.certiva.pilot"])
      .split("\n")
      .find((line) => line.startsWith("package:"))
      ?.slice(8);
    if (!packagePath) throw new Error("Certiva APK is not installed.");
    result.installedApkSha256 = command(["shell", "sha256sum", packagePath]).split(/\s+/)[0];
    if (result.installedApkSha256 !== result.apkSha256)
      throw new Error("Installed APK does not match the supplied artifact.");
    for (const name of ["main", "home", "notification", "detail", "report", "settings", "recent", "return"])
      command(["shell", "rm", "-f", `/sdcard/Android/data/local.certiva.pilot/files/android-protection-${name}.png`]);
    result.installedPackage = command(["shell", "dumpsys", "package", "local.certiva.pilot"])
      .split("\n")
      .filter((l) => /versionCode=|versionName=/.test(l))
      .map((l) => l.trim());
    const started = command([
      "shell",
      `screenrecord --size 720x1600 --bit-rate 1000000 --time-limit 180 ${remote} >/dev/null 2>&1 & echo $!`,
    ]);
    pid = started.split(/\s+/).pop();
    if (!/^\d+$/.test(pid)) throw new Error("Could not identify this recording process.");
    const log = [];
    const status = await new Promise((resolve, reject) => {
      const child = spawn(adb, [
        "-s",
        serial,
        "shell",
        "am",
        "instrument",
        "-w",
        "-e",
        "class",
        result.test,
        "local.certiva.pilot.test/android.test.InstrumentationTestRunner",
      ]);
      const deadline = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error("Flow test exceeded 150 seconds."));
      }, 150000);
      for (const stream of [child.stdout, child.stderr])
        stream.on("data", (bytes) => {
          const text = bytes.toString();
          log.push(text);
          process.stdout.write(text);
        });
      child.once("error", (e) => {
        clearTimeout(deadline);
        reject(e);
      });
      child.once("close", (code) => {
        clearTimeout(deadline);
        resolve(code);
      });
    }).finally(() => fs.writeFileSync(path.join(output, "instrumentation.txt"), log.join("")));
    result.passed =
      status === 0 && /OK \(1 test\)/.test(log.join("")) && !/FAILURES|INSTRUMENTATION_FAILED/.test(log.join(""));
    if (!result.passed) throw new Error("Native flow test failed; see instrumentation.txt.");
  } catch (error) {
    result.passed = false;
    result.error = error.message;
    process.exitCode = 1;
    if (error.message.includes("exceeded")) command(["shell", "am", "force-stop", "local.certiva.pilot"], true);
  } finally {
    if (pid && /^\d+$/.test(pid)) {
      command(["shell", "kill", "-2", pid], true);
      for (let i = 0; i < 20; i++) {
        const running = command(["shell", "ps", "-p", pid, "-o", "ARGS="], true);
        if (!running.includes("screenrecord")) break;
        await new Promise((r) => setTimeout(r, 250));
      }
      try {
        command(["pull", remote, path.join(output, "android-flow.mp4")]);
        result.video = "android-flow.mp4";
      } catch (error) {
        result.recordingError = error.message;
        process.exitCode = 1;
      }
    }
    for (const name of ["main", "home", "notification", "detail", "report", "settings", "recent", "return"])
      command(
        [
          "pull",
          `/sdcard/Android/data/local.certiva.pilot/files/android-protection-${name}.png`,
          path.join(output, `${name}.png`),
        ],
        true,
      );
    result.completedAt = new Date().toISOString();
    fs.writeFileSync(path.join(output, "result.json"), JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result, null, 2));
  }
})();
