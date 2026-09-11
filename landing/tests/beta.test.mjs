import assert from "node:assert/strict";
import test from "node:test";
import { addMember, callback, configuration, publicStatus, seal, start, unseal } from "../server/beta.mjs";

const env = {
  BETA_ENABLED: "true",
  BETA_GOOGLE_CLIENT_ID: "public-client",
  BETA_GOOGLE_CLIENT_SECRET: "public-secret",
  BETA_COOKIE_SECRET: "test-only-cookie-key-32-characters-long",
  BETA_GROUP_SERVICE_ACCOUNT_EMAIL: "test-only@example.iam.gserviceaccount.com",
  BETA_GROUP_PRIVATE_KEY: "test-only-key",
  BETA_PLAY_URL: "https://play.google.com/apps/testing/local.certiva.pilot",
};
function response() {
  return {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(body) {
      this.body = body;
    },
  };
}
function request(overrides = {}) {
  return { method: "GET", headers: {}, url: "/api/beta/callback", ...overrides };
}
const flow = () => ({
  state: "state",
  nonce: "nonce",
  codeVerifier: "verifier",
  consent: true,
  exp: Date.now() + 60_000,
});
function callbackReq(value = flow(), state = "state") {
  return request({
    url: `/api/beta/callback?state=${state}&code=code`,
    headers: { cookie: `__Host-certiva-beta-flow=${seal(value, env.BETA_COOKIE_SECRET)}` },
  });
}
function oauth(identity) {
  return {
    async getToken() {
      return { tokens: { id_token: "token" } };
    },
    async verifyIdToken() {
      return { getPayload: () => identity };
    },
  };
}

test("registration fails closed without every configured dependency and the exact Play destination", () => {
  assert.equal(configuration({}).enabled, false);
  assert.equal(configuration({ ...env, BETA_GROUP_PRIVATE_KEY: "" }).enabled, false);
  assert.equal(configuration({ ...env, BETA_PLAY_URL: "https://evil.example/" }).enabled, false);
  assert.equal(
    configuration({ ...env, BETA_PLAY_URL: "https://play.google.com/apps/testing/another.app" }).enabled,
    false,
  );
  assert.equal(configuration(env).enabled, true);
});
test("encrypted cookies reject tampering, expiration and the wrong key", () => {
  const token = seal(flow(), env.BETA_COOKIE_SECRET);
  assert.equal(unseal(token, env.BETA_COOKIE_SECRET).state, "state");
  assert.equal(unseal(token, "wrong-key"), null);
  const bytes = Buffer.from(token, "base64url");
  bytes[30] ^= 1;
  assert.equal(unseal(bytes.toString("base64url"), env.BETA_COOKIE_SECRET), null);
  assert.equal(unseal(token, env.BETA_COOKIE_SECRET, Date.now() + 120_000), null);
});
test("registration start requires same origin and affirmative consent", async () => {
  const req = request({
    method: "POST",
    headers: { origin: "https://other.example", "content-type": "application/x-www-form-urlencoded" },
    body: { email: "test@example.com", consent: "yes" },
  });
  let res;
  for (const origin of [
    "https://other.example",
    "null",
    undefined,
    "https://certiva-landing.vercel.app.evil.example",
  ]) {
    req.headers.origin = origin;
    res = response();
    await start(req, res, env);
    assert.equal(res.statusCode, 403);
    assert.equal(res.headers["Set-Cookie"], undefined);
  }
  req.headers.origin = "https://certiva-landing.vercel.app";
  req.body.consent = "no";
  res = response();
  await start(req, res, env);
  assert.match(res.headers.Location, /consentimiento/);
  req.body.consent = "yes";
  res = response();
  await start(req, res, env);
  const url = new URL(res.headers.Location);
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("scope"), "openid email");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("state"));
  assert.ok(url.searchParams.get("nonce"));
  assert.match(res.headers["Set-Cookie"][0], /HttpOnly; Secure; SameSite=Lax/);
});
test("callback rejects mismatched state before token exchange or membership changes", async () => {
  let called = false;
  const res = response();
  await callback(callbackReq(flow(), "wrong"), res, env, {
    oauth: {
      getToken() {
        called = true;
      },
    },
  });
  assert.equal(called, false);
  assert.equal(res.headers.Location, "/probar?estado=sesion");
});
test("unverified emails and mismatched nonce never add members", async () => {
  for (const identity of [
    { email: "test@example.com", email_verified: false, nonce: "nonce" },
    { email: "test@example.com", email_verified: true, nonce: "other" },
  ]) {
    let added = false;
    const res = response();
    await callback(callbackReq(), res, env, {
      oauth: oauth(identity),
      addMember() {
        added = true;
      },
    });
    assert.equal(added, false);
    assert.match(res.headers.Location, /reintentar/);
  }
});
test("successful membership uses only the Google verified email and returns a private result cookie", async () => {
  let added;
  const res = response();
  await callback(callbackReq(), res, env, {
    oauth: oauth({ email: "verified@example.com", email_verified: true, nonce: "nonce" }),
    async addMember(email) {
      added = email;
    },
  });
  assert.equal(added, "verified@example.com");
  assert.equal(res.headers.Location, "/probar?estado=listo");
  const resultCookie = res.headers["Set-Cookie"][1].split(";")[0];
  assert.ok(!resultCookie.includes("verified@example.com"));
  const status = response();
  publicStatus(request({ headers: { cookie: resultCookie } }), status, env);
  const data = JSON.parse(status.body);
  assert.equal(data.registered, true);
  assert.equal(data.email, added);
  assert.equal(data.playReady, false);
  assert.equal(data.playUrl, undefined);
  assert.equal(status.headers["Cache-Control"], "no-store");
  const ready = response();
  publicStatus(request({ headers: { cookie: resultCookie } }), ready, { ...env, BETA_PLAY_READY: "true" });
  assert.equal(JSON.parse(ready.body).playUrl, env.BETA_PLAY_URL);
  assert.equal(JSON.parse(ready.body).playReady, true);
  const disabled = response();
  publicStatus(request({ headers: { cookie: resultCookie } }), disabled, {
    ...env,
    BETA_ENABLED: "false",
    BETA_PLAY_READY: "true",
  });
  assert.equal(JSON.parse(disabled.body).registered, false);
  assert.equal(JSON.parse(disabled.body).playReady, false);
  assert.equal(JSON.parse(disabled.body).email, undefined);
  assert.equal(JSON.parse(disabled.body).playUrl, undefined);
});
test("published Play track redirects directly only after verified membership", async () => {
  const readyEnv = { ...env, BETA_PLAY_READY: "true" };
  const res = response();
  let confirmed = false;
  await callback(callbackReq(), res, readyEnv, {
    oauth: oauth({ email: "verified@example.com", email_verified: true, nonce: "nonce" }),
    async addMember() {
      confirmed = true;
    },
  });
  assert.equal(confirmed, true);
  assert.equal(res.statusCode, 303);
  assert.equal(res.headers.Location, env.BETA_PLAY_URL);
  assert.equal(res.headers["Referrer-Policy"], "no-referrer");
  assert.ok(!res.headers.Location.includes("verified@example.com"));
  assert.equal(res.headers["Set-Cookie"].length, 2);
});
test("membership failure does not claim access or emit a success cookie even when Play is ready", async () => {
  const res = response();
  await callback(
    callbackReq(),
    res,
    { ...env, BETA_PLAY_READY: "true" },
    {
      oauth: oauth({ email: "test@example.com", email_verified: true, nonce: "nonce" }),
      async addMember() {
        throw new Error("Unavailable");
      },
    },
  );
  assert.equal(res.headers.Location, "/probar?estado=reintentar");
  assert.equal(typeof res.headers["Set-Cookie"], "string");
  assert.ok(!res.headers["Set-Cookie"].includes("beta-result"));
});

test("new and duplicate memberships require an exact confirmed Google group member", async () => {
  for (const duplicate of [false, true]) {
    const calls = [];
    const admin = {
      async request(req) {
        calls.push(req);
        if (calls.length === 1) return { data: { name: "groups/certiva" } };
        if (calls.length === 2) {
          if (duplicate) throw { response: { status: 409 } };
          return { data: { done: true } };
        }
        if (calls.length === 3) return { data: { name: "groups/certiva/memberships/tester" } };
        return { data: { preferredMemberKey: { id: "tester@example.com" }, roles: [{ name: "MEMBER" }] } };
      },
    };
    await addMember("tester@example.com", env, { admin });
    assert.equal(calls[0].params["groupKey.id"], "certiva-testers@grwestate.com");
    assert.deepEqual(calls[1].data, { preferredMemberKey: { id: "tester@example.com" }, roles: [{ name: "MEMBER" }] });
    assert.equal(calls[2].params["memberKey.id"], "tester@example.com");
    assert.equal(calls.length, 4);
  }
});
test("pending, expired, wrong and cross-group membership cannot confirm access", async () => {
  for (const result of ["pending", "expired", "wrong-email", "wrong-group"]) {
    let count = 0;
    const admin = {
      async request() {
        count++;
        if (count === 1) return { data: { name: "groups/certiva" } };
        if (count === 2) return { data: { done: false } };
        if (count === 3) {
          if (result === "pending") throw { response: { status: 404 } };
          return { data: { name: `groups/${result === "wrong-group" ? "other" : "certiva"}/memberships/tester` } };
        }
        return {
          data: {
            preferredMemberKey: { id: result === "wrong-email" ? "other@example.com" : "tester@example.com" },
            roles: [
              {
                name: "MEMBER",
                ...(result === "expired" ? { expiryDetail: { expireTime: "2020-01-01T00:00:00Z" } } : {}),
              },
            ],
          },
        };
      },
    };
    await assert.rejects(addMember("tester@example.com", env, { admin }));
  }
});
