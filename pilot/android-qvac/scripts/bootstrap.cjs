const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const digest = "e152c1e186251e2fc944cb7c3e7508899d5de3acb1568e1a922e0ed96a135af3";
(async () => {
  fs.mkdirSync(path.join(root, "vendor"), { recursive: true });
  const zip = process.argv[2] || path.join(root, "vendor/bare-kit-2.4.3.zip");
  if (!fs.existsSync(zip)) {
    const response = await fetch("https://github.com/holepunchto/bare-kit/releases/download/v2.4.3/prebuilds.zip");
    if (!response.ok) throw Error("Bare Kit download failed: " + response.status);
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(zip));
  }
  const hash = crypto.createHash("sha256");
  for await (const chunk of fs.createReadStream(zip)) hash.update(chunk);
  if (hash.digest("hex") !== digest) throw Error("Bare Kit checksum mismatch");
  execFileSync("unzip", ["-oq", zip, "android/bare-kit/*", "-d", path.join(root, "vendor")], { stdio: "inherit" });
  console.log("Bare Kit 2.4.3 verified");
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
