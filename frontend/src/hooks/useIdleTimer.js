import { useEffect, useRef, useCallback } from "react";

// Events that count as "the patient is still here" — covers touchscreen
// kiosks (touchstart), mouse/trackpad use, and any keyboard input.
const ACTIVITY_EVENTS = ["mousedown", "touchstart", "keydown", "pointerdown"];

/**
 * Fires `onWarn` after `warnAfterMs` of no user activity, then `onTimeout`
 * after a further `graceMs` if the user still hasn't interacted. Any
 * activity event resets the whole cycle back to the start (including
 * during the warning/grace period).
 *
 * `enabled` lets the caller turn the whole timer off (e.g. on non-kiosk
 * routes) without unmounting the component that owns it.
 */
export function useIdleTimer({ warnAfterMs, graceMs, onWarn, onTimeout, enabled = true }) {
  const warnTimeoutRef = useRef(null);
  const clearTimeoutRef = useRef(null);

  // Keep the latest callbacks in refs so resetTimers() doesn't need to be
  // recreated (and re-attached to listeners) every time a parent re-renders.
  const onWarnRef = useRef(onWarn);
  const onTimeoutRef = useRef(onTimeout);
  onWarnRef.current = onWarn;
  onTimeoutRef.current = onTimeout;

  const clearTimers = useCallback(() => {
    if (warnTimeoutRef.current) clearTimeout(warnTimeoutRef.current);
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    if (!enabled) return;
    warnTimeoutRef.current = setTimeout(() => {
      onWarnRef.current?.();
      clearTimeoutRef.current = setTimeout(() => {
        onTimeoutRef.current?.();
      }, graceMs);
    }, warnAfterMs);
  }, [enabled, warnAfterMs, graceMs, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }
    resetTimers();
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimers));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimers));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, warnAfterMs, graceMs]);

  // Exposed so the "I'm still here" button in the warning modal can
  // explicitly reset the cycle too (in addition to it counting as a
  // click, which already triggers ACTIVITY_EVENTS on its own).
  return { resetTimers };
}