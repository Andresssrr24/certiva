import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { CodeChallengeMethod, JWT, OAuth2Client } from "google-auth-library";

export const INTERNAL_URL = "https://play.google.com/apps/internaltest/4701618464331966700";
const ORIGIN = "https://certiva-landing.vercel.app";
const FLOW_COOKIE = "__Host-certiva-beta-flow";
const RESULT_COOKIE = "__Host-certiva-beta-result";
const MEMBER_SCOPE = "https://www.googleapis.com/auth/cloud-identity.groups";
const GROUP = "certiva-testers@grwestate.com";

export function configuration(env = process.env) {
  const names = [
    "BETA_GOOGLE_CLIENT_ID",
    "BETA_GOOGLE_CLIENT_SECRET",
    "BETA_COOKIE_SECRET",
    "BETA_GROUP_SERVICE_ACCOUNT_EMAIL",
    "BETA_GROUP_PRIVATE_KEY",
    "BETA_PLAY_URL",
  ];
  const enabled =
    env.BETA_ENABLED === "true" && names.every((name) => Boolean(env[name])) && env.BETA_COOKIE_SECRET.length >= 32;
  let playUrl;
  try {
    const url = new URL(env.BETA_PLAY_URL);
    if (
      url.origin === "https://play.google.com" &&
      url.pathname === "/apps/testing/local.certiva.pilot" &&
      !url.search &&
      !url.hash
    )
      playUrl = url.href;
  } catch {}
  return {
    enabled: enabled && Boolean(playUrl),
    playReady: env.BETA_PLAY_READY === "true" && Boolean(playUrl),
    playUrl,
    env,
  };
}

export function seal(value, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

export function unseal(value, secret, now = Date.now()) {
  try {
    if (!value || value.length > 4096 || !secret) return null;
    const data = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      createHash("sha256").update(secret).digest(),
      data.subarray(0, 12),
    );
    decipher.setAuthTag(data.subarray(12, 28));
    const result = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString());
    return Number.isFinite(result.exp) && result.exp > now ? result : null;
  } catch {
    return null;
  }
}

function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "").split(";").map((part) => {
      const at = part.indexOf("=");
      return [part.slice(0, at).trim(), part.slice(at + 1).trim()];
    }),
  );
}
function cookie(name, value, age) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
}
function protect(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
function json(res, status, value) {
  protect(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(value));
}
function redirect(res, location) {
  protect(res);
  res.statusCode = 303;
  res.setHeader("Location", location);
  res.end();
}
function equal(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aa = Buffer.from(a),
    bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function client(env) {
  return new OAuth2Client(env.BETA_GOOGLE_CLIENT_ID, env.BETA_GOOGLE_CLIENT_SECRET, `${ORIGIN}/api/beta/callback`);
}

export function publicStatus(req, res, env = process.env) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  const cfg = configuration(env);
  const result = unseal(cookies(req)[RESULT_COOKIE], env.BETA_COOKIE_SECRET);
  json(res, 200, {
    enabled: cfg.enabled,
    playReady: cfg.enabled && cfg.playReady,
    internalUrl: INTERNAL_URL,
    registered: cfg.enabled && result?.status === "registered",
    ...(cfg.enabled && result?.status === "registered"
      ? { email: result.email, ...(cfg.playReady ? { playUrl: cfg.playUrl } : {}) }
      : {}),
  });
}

export async function start(req, res, env = process.env) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  if (req.headers.origin !== ORIGIN) return json(res, 403, { error: "origin" });
  if (!configuration(env).enabled) return redirect(res, "/probar?estado=pendiente");
  const type = (req.headers["content-type"] || "").split(";")[0];
  if (type !== "application/x-www-form-urlencoded") return json(res, 415, { error: "type" });
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    if (Buffer.byteLength(body) > 2048) return json(res, 413, { error: "size" });
    body = Object.fromEntries(new URLSearchParams(body));
  }
  if (body?.consent !== "yes") return redirect(res, "/probar?estado=consentimiento");
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return redirect(res, "/probar?estado=correo");
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const oauth = client(env);
  const { codeVerifier, codeChallenge } = await oauth.generateCodeVerifierAsync();
  const flow = { state, nonce, codeVerifier, consent: true, exp: Date.now() + 10 * 60_000 };
  res.setHeader("Set-Cookie", [
    cookie(FLOW_COOKIE, seal(flow, env.BETA_COOKIE_SECRET), 600),
    cookie(RESULT_COOKIE, "", 0),
  ]);
  redirect(
    res,
    oauth.generateAuthUrl({
      scope: ["openid", "email"],
      state,
      nonce,
      login_hint: email,
      prompt: "select_account",
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    }),
  );
}

export async function addMember(email, env = process.env, dependencies = {}) {
  // This service account owns only the dedicated testers group. No user impersonation,
  // Workspace admin role or domain-wide delegation is needed.
  const admin =
    dependencies.admin ||
    new JWT({ email: env.BETA_GROUP_SERVICE_ACCOUNT_EMAIL, key: env.BETA_GROUP_PRIVATE_KEY, scopes: [MEMBER_SCOPE] });
  const base = "https://cloudidentity.googleapis.com/v1";
  const group = await admin.request({
    url: `${base}/groups:lookup`,
    params: { "groupKey.id": GROUP },
    timeout: 15_000,
  });
  const parent = group.data?.name;
  if (!/^groups\/[a-zA-Z0-9_-]+$/.test(parent || "")) throw new Error("Group not confirmed");
  const url = `${base}/${parent}/memberships`;
  try {
    const operation = await admin.request({
      url,
      method: "POST",
      data: { preferredMemberKey: { id: email }, roles: [{ name: "MEMBER" }] },
      timeout: 15_000,
    });
    if (operation.data?.error) throw new Error("Membership creation failed");
  } catch (error) {
    if (error.response?.status !== 409) throw error;
  }
  // Both new and duplicate membership must be confirmed, including asynchronous creation.
  const lookup = await admin.request({ url: `${url}:lookup`, params: { "memberKey.id": email }, timeout: 15_000 });
  const name = lookup.data?.name;
  if (
    !name?.startsWith(`${parent}/memberships/`) ||
    !/^groups\/[a-zA-Z0-9_-]+\/memberships\/[a-zA-Z0-9_-]+$/.test(name)
  )
    throw new Error("Member not confirmed");
  const existing = await admin.request({ url: `${base}/${name}`, timeout: 15_000 });
  if (
    existing.data?.preferredMemberKey?.id?.toLowerCase() !== email.toLowerCase() ||
    !existing.data?.roles?.some(
      (role) =>
        role.name === "MEMBER" &&
        (!role.expiryDetail?.expireTime || Date.parse(role.expiryDetail.expireTime) > Date.now()),
    )
  )
    throw new Error("Member not confirmed");
}

export async function callback(req, res, env = process.env, dependencies = {}) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  const cfg = configuration(env);
  const flow = unseal(cookies(req)[FLOW_COOKIE], env.BETA_COOKIE_SECRET);
  res.setHeader("Set-Cookie", cookie(FLOW_COOKIE, "", 0));
  const query = new URL(req.url, ORIGIN).searchParams;
  if (!cfg.enabled || !flow?.consent || !equal(query.get("state"), flow.state))
    return redirect(res, "/probar?estado=sesion");
  if (query.has("error")) return redirect(res, "/probar?estado=cancelado");
  const code = query.get("code");
  if (!code || code.length > 4096) return redirect(res, "/probar?estado=sesion");
  try {
    const oauth = dependencies.oauth || client(env);
    const { tokens } = await oauth.getToken({ code, codeVerifier: flow.codeVerifier });
    if (!tokens.id_token) throw new Error("Missing identity");
    const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token, audience: env.BETA_GOOGLE_CLIENT_ID });
    const identity = ticket.getPayload();
    if (!identity?.email_verified || !identity.email || !equal(identity.nonce, flow.nonce))
      throw new Error("Unverified identity");
    await (dependencies.addMember || addMember)(identity.email, env);
    res.setHeader("Set-Cookie", [
      cookie(FLOW_COOKIE, "", 0),
      cookie(
        RESULT_COOKIE,
        seal({ status: "registered", email: identity.email, exp: Date.now() + 3600_000 }, env.BETA_COOKIE_SECRET),
        3600,
      ),
    ]);
    return redirect(res, cfg.playReady ? cfg.playUrl : "/probar?estado=listo");
  } catch {
    // Do not log OAuth codes, email addresses, credentials or upstream response bodies.
    return redirect(res, "/probar?estado=reintentar");
  }
}

export { MEMBER_SCOPE };
