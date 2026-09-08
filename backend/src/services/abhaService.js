/**
 * ABHA (Ayushman Bharat Health Account) identity verification — facade.
 * -----------------------------------------------------------------------
 * This module is the ONLY thing routes/patients.js talks to. It decides,
 * per call, whether to hit the real ABDM Gateway (see
 * abdmGatewayService.js) or fall back to an in-memory OTP simulation:
 *
 *   - If ABDM_CLIENT_ID + ABDM_CLIENT_SECRET are set in .env, every
 *     generateOtp()/verifyOtp() call goes to the REAL ABDM sandbox/prod
 *     Gateway API.
 *   - Otherwise, it simulates the OTP challenge/response step locally
 *     (generate a 6-digit code, verify it, expire after 5 min, single
 *     use) so the rest of the app — frontend flow, patient-record
 *     prefill, FHIR push — can be built and demoed without NHA-issued
 *     credentials.
 *
 * routes/patients.js never needs to know which mode is active: it just
 * calls generateOtp(abha) then verifyOtp(abha, otp), same as before.
 */

import { isAbdmConfigured, initAbhaAuth, confirmAbhaOtp, AbdmError } from "./abdmGatewayService.js";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Simulated-mode store: abha -> { otp, expiresAt }
const otpStore = new Map();

// Real-mode store: abha -> { txnId, expiresAt } (txnId returned by ABDM's
// auth/init call, needed to confirm the OTP in the next step)
const txnStore = new Map();

/**
 * Starts an ABHA login. In real mode this calls the actual ABDM Gateway
 * and the patient's phone receives a real SMS OTP from NHA; in
 * simulated mode it generates a local OTP and returns it directly (dev
 * convenience only — routes/patients.js only surfaces `otp` to the
 * frontend when ABDM isn't configured, see devOtp handling there).
 *
 * @returns {Promise<{ otp?: string, expiresInSeconds: number, mode: "real"|"simulated" }>}
 */
export async function generateOtp(abha) {
  if (isAbdmConfigured()) {
    try {
      const { txnId } = await initAbhaAuth(abha);
      txnStore.set(abha, { txnId, expiresAt: Date.now() + OTP_TTL_MS });
      return { expiresInSeconds: OTP_TTL_MS / 1000, mode: "real" };
    } catch (err) {
      // Surface a clean, actionable error rather than leaking ABDM's
      // internal error shape to the frontend.
      throw new AbhaFlowError(
        err instanceof AbdmError ? err.code : "ABDM_UNAVAILABLE",
        "Could not reach the ABDM server. Please try again in a moment, or use hospital-ID lookup instead."
      );
    }
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpStore.set(abha, { otp, expiresAt });
  return { otp, expiresInSeconds: OTP_TTL_MS / 1000, mode: "simulated" };
}

/**
 * Confirms the OTP the patient received. Returns false on any invalid/
 * expired/mismatched OTP; throws only on a genuine upstream failure.
 *
 * @returns {Promise<boolean>}
 */
export async function verifyOtp(abha, otp) {
  if (isAbdmConfigured()) {
    const entry = txnStore.get(abha);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      txnStore.delete(abha);
      return false;
    }
    try {
      await confirmAbhaOtp(entry.txnId, otp);
      txnStore.delete(abha); // one-time use
      return true;
    } catch (err) {
      // Wrong/expired OTP from ABDM's side reads as a rejected request,
      // not a thrown error the caller needs to handle specially.
      if (err instanceof AbdmError) return false;
      throw err;
    }
  }

  const entry = otpStore.get(abha);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(abha);
    return false;
  }
  const ok = entry.otp === String(otp).trim();
  if (ok) otpStore.delete(abha);
  return ok;
}

/** Masks an ABHA number for display, e.g. "12345678901234" -> "•••• •••• 1234". */
export function maskAbha(abha) {
  if (!abha || abha.length < 4) return abha || "";
  return `•••• •••• ${abha.slice(-4)}`;
}

/** True when this deployment is wired to the real ABDM Gateway. */
export { isAbdmConfigured };

export class AbhaFlowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AbhaFlowError";
    this.code = code;
  }
}