import { randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { accountKey, newAccount } from "../server/reports/service.mjs";
import { blobStore } from "../server/reports/store.mjs";
import { preparePrivateDirectory } from "./private-directory.mjs";

const dir = await preparePrivateDirectory(process.argv[2]);
process.loadEnvFile(resolve(dir, "reports-production.env"));
const username = "revision-play";
const file = resolve(dir, `${username}.json`);
let credentials;
try {
  credentials = JSON.parse(await readFile(file, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  credentials = { username, password: randomBytes(24).toString("base64url") };
  await writeFile(file, JSON.stringify(credentials, null, 2), { mode: 0o600, flag: "wx" });
}
await chmod(file, 0o600);
const store = blobStore();
const key = accountKey(username);
if (!(await store.read(key))) {
  if (!(await store.write(key, await newAccount(username, credentials.password))))
    throw new Error("Provisioning conflict");
}
const confirmed = await store.read(key);
if (!confirmed?.value.active || confirmed.value.username !== username) throw new Error("Account not confirmed");
const secretFile = resolve(dir, "reports-cookie-secret.txt");
try {
  await readFile(secretFile);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await writeFile(secretFile, randomBytes(48).toString("base64url"), { mode: 0o600, flag: "wx" });
}
console.log("One review account confirmed. Private credentials retained outside the repository; no passwords printed.");
