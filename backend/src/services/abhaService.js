/**
 * Simulated ABHA (Ayushman Bharat Health Account) identity verification.
 * -----------------------------------------------------------------------
 * This is NOT a live ABDM (Ayushman Bharat Digital Mission) gateway
 * integration — that requires an approved sandbox/production API key
 * issued by the National Health Authority, which this kiosk does not
 * have configured. This module simulates the OTP challenge/response
 * step of a real ABHA login (generate a one-time code, verify it,
 * expire it after a few minutes, single use) so the rest of the app —
 * frontend flow, patient-record prefill, FHIR push — can be built and
 * demoed against a realistic UX.
 *
 * Swapping this for a real ABDM API call later should only require
 * changing this file: routes/patients.js just calls generateOtp() /
 * verifyOtp() and doesn't know or care how they're implemented.
 *
 * NOTE: the OTP store below is in-memory (a plain Map), which is fine
 * for a single-process kiosk backend but will NOT survive a restart or
 * work across multiple server instances. For a multi-kiosk deployment,
 * back this with Redis (or the DB) instead.
 */

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const otpStore = new Map(); // abha -> { otp, expiresAt }

/**
 * Generates and stores a fresh 6-digit OTP for the given ABHA number.
 * Returns the OTP itself (only ever surfaced to the frontend in dev/demo
 * mode — see routes/patients.js) plus how long it's valid for.
 */
export function generateOtp(abha) {
  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpStore.set(abha, { otp, expiresAt });
  return { otp, expiresInSeconds: OTP_TTL_MS / 1000 };
}

/**
 * Verifies a submitted OTP against the stored one for this ABHA number.
 * One-time use: a correct OTP is consumed (deleted) on success so it
 * can't be replayed.
 */
export function verifyOtp(abha, otp) {
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