import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../public/beta.js", import.meta.url), "utf8");
async function render(data) {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id))
        elements.set(id, {
          hidden: true,
          addEventListener() {},
          removeAttribute(key) {
            delete this[key];
          },
        });
      return elements.get(id);
    },
  };
  runInNewContext(source, {
    document,
    window: { addEventListener() {} },
    location: { search: "" },
    URL,
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => data }),
  });
  await new Promise((resolve) => setImmediate(resolve));
  return (id) => elements.get(id);
}
test("confirmed registration shows pending download without a Play link", async () => {
  const get = await render({ enabled: true, registered: true, playReady: false, email: "verified@example.com" });
  assert.equal(get("beta-success").hidden, false);
  assert.equal(get("registered-email").textContent, "verified@example.com");
  assert.equal(get("play-pending").hidden, false);
  assert.equal(get("play-link").hidden, true);
  assert.equal(get("play-link").href, undefined);
  assert.equal(get("beta-form").hidden, true);
});
test("installation requires explicit readiness and a validated Play URL", async () => {
  const get = await render({
    enabled: true,
    registered: true,
    playReady: true,
    email: "verified@example.com",
    playUrl: "https://play.google.com/apps/testing/local.certiva.pilot",
  });
  assert.equal(get("play-link").hidden, false);
  assert.equal(get("play-pending").hidden, true);
  const invalid = await render({ enabled: true, registered: true, playReady: true, playUrl: "https://evil.example" });
  assert.equal(invalid("beta-success").hidden, true);
  assert.equal(invalid("play-link").href, undefined);
});
test("new visitors can register while download is pending", async () => {
  const get = await render({ enabled: true, registered: false, playReady: false });
  assert.equal(get("beta-form").hidden, false);
  assert.equal(get("play-pending").hidden, false);
  assert.equal(get("beta-success").hidden, true);
});
