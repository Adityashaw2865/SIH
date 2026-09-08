import rateLimit from "express-rate-limit";

/**
 * Strict limiter for the login route — this is the #1 brute-force target.
 * 10 attempts per 15 minutes per IP. Deliberately tight: a real user
 * mistyping a password a few times is fine, a script trying thousands
 * of passwords is not.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many login attempts. Please wait 15 minutes and try again."
    }
  }
});

/**
 * Looser limiter for the one-time seed-admin route. This route is
 * already self-limiting (only works while zero staff exist), but rate
 * limiting closes the race-condition window where two requests could
 * both pass the "count === 0" check before either finishes writing.
 */
export const seedAdminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many attempts. Please wait and try again."
    }
  }
});

/**
 * General limiter for public kiosk endpoints that do real work per
 * request (OCR, speech transcription, document upload) — these have no
 * login to rate-limit against, so we throttle by IP instead. Generous
 * enough for a genuine patient session, tight enough to blunt a script
 * hammering the endpoint to burn server CPU (DoS via OCR/Whisper load).
 */
export const heavyEndpointLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests from this device. Please wait a few minutes and try again."
    }
  }
});

/**
 * Baseline limiter applied to the whole API as a last line of defence
 * against generic scripted abuse. Kept loose so it never interferes
 * with normal kiosk/dashboard usage.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please slow down and try again shortly."
    }
  }
});