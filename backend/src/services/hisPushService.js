import { randomUUID } from "crypto";

/**
 * Simulated push of a FHIR bundle to a hospital HIS / the ABDM ecosystem.
 * -----------------------------------------------------------------------
 * This is NOT a real HIS/ABDM gateway integration — that requires an
 * approved sandbox/production endpoint + credentials this kiosk does not
 * have configured (see AdminIntegrations.jsx for the current status).
 *
 * This module simulates what that gateway call would look like — realistic
 * network latency, a generated transaction/acknowledgement id, and
 * (optionally, for demoing error-handling) a simulated failure — so the
 * rest of the app (the "Push to HIS" button, patient-level push status,
 * audit log) can be built and demoed end-to-end against a realistic UX.
 *
 * Swapping this for a real HIS/ABDM gateway call later should only
 * require changing this file: routes/summary.js just calls
 * pushBundleToHis() and doesn't know or care how it's implemented.
 */

const SIMULATED_LATENCY_MS = 900;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pushes a FHIR bundle to the (mock) HIS/ABDM gateway.
 *
 * @param {object} bundle - the FHIR Bundle to send
 * @param {object} [opts]
 * @param {boolean} [opts.simulateFailure] - force a simulated gateway
 *   rejection, for demoing what a failed push looks like in the UI.
 * @returns {Promise<{ok: boolean, transactionId?: string, errorMessage?: string}>}
 */
export async function pushBundleToHis(bundle, { simulateFailure = false } = {}) {
  await delay(SIMULATED_LATENCY_MS);

  if (!bundle?.entry?.length) {
    return { ok: false, errorMessage: "Nothing to push — the FHIR bundle is empty. Generate a summary first." };
  }

  if (simulateFailure) {
    return { ok: false, errorMessage: "HIS gateway rejected the bundle (simulated): connection timed out." };
  }

  // In a real integration this would be the ack/transaction id the HIS
  // (or ABDM's Health Information Gateway) returns on accepting the
  // bundle. We fabricate one in the same shape so the rest of the app
  // (audit log, "sent" badge) doesn't need to change when this is swapped
  // for a real gateway call.
  const transactionId = `HIS-${randomUUID().split("-")[0].toUpperCase()}`;
  return { ok: true, transactionId };
}