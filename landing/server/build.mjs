import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../public/downloads/manifest.json", import.meta.url), "utf8"));
if (!/^certiva-[a-z0-9.-]+\.apk$/.test(manifest.apk)) throw new Error("Invalid APK filename in download manifest.");
let apk;
try {
  apk = await readFile(new URL(`../public/downloads/${manifest.apk}`, import.meta.url));
} catch {
  throw new Error(`Copy the frozen pilot APK to public/downloads/${manifest.apk} before deploying. See README.`);
}
if (apk.byteLength !== manifest.bytes || createHash("sha256").update(apk).digest("hex") !== manifest.sha256) {
  throw new Error("The APK does not match the published size and SHA-256. Deployment stopped.");
}
await rm(new URL("../dist/", import.meta.url), { recursive: true, force: true });
await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await cp(new URL("../public/", import.meta.url), new URL("../dist/", import.meta.url), { recursive: true });
console.log("Certiva: APK verificada y archivos públicos preparados en dist.");
