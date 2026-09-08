/**
 * Real ABDM (Ayushman Bharat Digital Mission) Gateway client.
 * ---------------------------------------------------------------------
 * Implements the actual NHA (National Health Authority) Gateway API flow
 * for ABHA-number-based patient login, as documented at:
 *   https://sandbox.abdm.gov.in/  (API docs / Swagger, "ABDM Gateway" &
 *   "ABHA Number/ABHA Address" services)
 *
 * This talks to the REAL sandbox (or production) ABDM Gateway once you
 * have credentials. It is NOT active unless both ABDM_CLIENT_ID and
 * ABDM_CLIENT_SECRET are set — see abhaService.js, which is the facade
 * the rest of the app calls, and which falls back to the in-memory OTP
 * simulation when this module isn't configured.
 *
 * How to get credentials (as of ABDM's published onboarding process):
 *   1. Register as an HFR (Health Facility Registry) facility and as an
 *      ABDM-integrating application at https://sandbox.abdm.gov.in
 *   2. NHA issues a sandbox clientId/clientSecret for the "Gateway" API.
 *   3. Set ABDM_BASE_URL, ABDM_CLIENT_ID, ABDM_CLIENT_SECRET,
 *      ABDM_X_CM_ID (defaults to "sbx" for sandbox) in .env.
 *   4. Move to production creds (separate approval) when going live.
 *
 * IMPORTANT: ABDM revises its API paths/versions periodically. The paths
 * below match the Gateway "Auth" service spec published at the time this
 * was written (v3 auth-confirm, v0.5 sessions). If NHA has since changed
 * a path, update ABDM_PATHS below — the rest of this file (and all of
 * abhaService.js / routes/patients.js) does not need to change.
 */

const BASE_URL = process.env.ABDM_BASE_URL || "https://dev.abdm.gov.in/gateway";
const CLIENT_ID = process.env.ABDM_CLIENT_ID;
const CLIENT_SECRET = process.env.ABDM_CLIENT_SECRET;
const X_CM_ID = process.env.ABDM_X_CM_ID || "sbx"; // "sbx" = sandbox consent manager id

const ABDM_PATHS = {
  session: "/v0.5/sessions",
  authInit: "/v3/auth/init",
  authConfirmMobileOtp: "/v3/auth/confirm/with/mobile-otp",
  authConfirmAadhaarOtp: "/v3/auth/confirm/with/aadhaar-otp",
  accountProfile: "/v2/account/profile"
};

/** True only when real ABDM credentials are configured. */
export function isAbdmConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

// ---------------------------------------------------------------------
// Session token (client-credentials grant) — cached and refreshed a
// minute before actual expiry so callers never see a stale token.
// ---------------------------------------------------------------------
let cachedToken = null; // { accessToken, expiresAt }

async function getSessionToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const res = await fetch(`${BASE_URL}${ABDM_PATHS.session}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      grantType: "client_credentials"
    })
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new AbdmError("SESSION_FAILED", `ABDM session request failed (${res.status})`, body);
  }

  const data = await res.json();
  const expiresInMs = (data.expiresIn ? Number(data.expiresIn) : 1800) * 1000;
  cachedToken = {
    accessToken: data.accessToken,
    // refresh 60s early so a request never races an expiring token
    expiresAt: Date.now() + expiresInMs - 60_000
  };
  return cachedToken.accessToken;
}

async function authedFetch(path, { method = "POST", body, extraHeaders = {} } = {}) {
  const token = await getSessionToken();
  const requestId = randomUuid();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-CM-ID": X_CM_ID,
      REQUEST_ID: requestId,
      TIMESTAMP: new Date().toISOString(),
      ...extraHeaders
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new AbdmError(data?.code || "ABDM_REQUEST_FAILED", data?.message || `ABDM request failed (${res.status})`, data);
  }
  return data;
}

/**
 * Step 1 of the real ABDM flow — initiates OTP for an existing ABHA
 * number. Returns a txnId that must be passed to confirmOtp().
 *
 * @param {string} abha - 14-digit ABHA number
 * @returns {Promise<{ txnId: string }>}
 */
export async function initAbhaAuth(abha) {
  const data = await authedFetch(ABDM_PATHS.authInit, {
    body: {
      authMethod: "MOBILE_OTP",
      healthid: abha
    }
  });
  return { txnId: data.txnId };
}

/**
 * Step 2 — confirms the OTP the patient received on their ABHA-linked
 * mobile number, completing the login.
 *
 * @param {string} txnId - from initAbhaAuth()
 * @param {string} otp
 * @returns {Promise<{ token: string, abhaProfile: object }>}
 */
export async function confirmAbhaOtp(txnId, otp) {
  const data = await authedFetch(ABDM_PATHS.authConfirmMobileOtp, {
    body: { otp, txnId }
  });
  return { token: data.token, abhaProfile: data.accounts?.[0] || null };
}

/** Fetches the patient's ABHA profile (name, gender, DOB, address) using their session token. */
export async function fetchAbhaProfile(abhaSessionToken) {
  const res = await fetch(`${BASE_URL}${ABDM_PATHS.accountProfile}`, {
    headers: { Authorization: `Bearer ${abhaSessionToken}`, "X-CM-ID": X_CM_ID }
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new AbdmError("PROFILE_FETCH_FAILED", `Could not fetch ABHA profile (${res.status})`, body);
  }
  return res.json();
}

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------

export class AbdmError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "AbdmError";
    this.code = code;
    this.details = details;
  }
}

async function safeJson(res) {
  try {
    return await res.clone().json();
  } catch {
    return null;
  }
}

function randomUuid() {
  // Node 20+ has crypto.randomUUID globally; guard for older runtimes.
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}