import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlarmClock } from "lucide-react";
import { Card, Button } from "./ui";
import { useIntake } from "../context/IntakeContext";
import { useIdleTimer } from "../hooks/useIdleTimer";

// Spec 3.3 Module D — "Session termination: temporary session data is
// cleared immediately after submission" already happens on successful
// completion (see PatientComplete.jsx -> resetSession()). This guard
// covers the other half of that requirement: a patient who walks away
// mid-intake without finishing. After a period of no touch/click/key
// activity we warn them, then auto-clear so the next patient on this
// shared kiosk never sees a trace of an abandoned session.
const WARN_AFTER_MS = 90 * 1000; // 90s of inactivity before warning
const GRACE_MS = 20 * 1000; // 20s to respond to the warning before clearing

// Only the patient-facing kiosk flow needs this — staff (doctor/triage/
// admin) are actively reading records for minutes at a time, not filling
// a form, and auto-logging them out mid-review would be actively harmful.
// The very first screen (/patient/start) and the final "thank you" screen
// (/patient/complete, which already resets on its own) don't need a
// second timer either — there's no partially-filled data there to protect.
function isGuardedPath(pathname) {
  return pathname.startsWith("/patient/") &&
    pathname !== "/patient/start" &&
    pathname !== "/patient/complete";
}

export default function IdleSessionGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetSession } = useIntake();
  const [warningOpen, setWarningOpen] = useState(false);

  const guarded = isGuardedPath(location.pathname);

  const handleWarn = useCallback(() => setWarningOpen(true), []);

  const handleTimeout = useCallback(() => {
    setWarningOpen(false);
    resetSession();
    navigate("/patient/start", { replace: true });
  }, [resetSession, navigate]);

  const { resetTimers } = useIdleTimer({
    warnAfterMs: WARN_AFTER_MS,
    graceMs: GRACE_MS,
    onWarn: handleWarn,
    onTimeout: handleTimeout,
    enabled: guarded
  });

  const stayHere = () => {
    setWarningOpen(false);
    resetTimers();
  };

  if (!warningOpen || !guarded) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-6">
      <Card className="max-w-sm w-full p-6 text-center animate-rise">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-warn flex items-center justify-center mx-auto mb-4">
          <AlarmClock size={24} />
        </div>
        <h2 className="text-lg font-extrabold text-ink mb-2">Are you still there?</h2>
        <p className="text-sm text-ink-soft mb-6">
          For your privacy, this session will clear automatically in a few seconds due to inactivity.
        </p>
        <Button size="lg" className="w-full" onClick={stayHere}>
          I'm still here
        </Button>
      </Card>
    </div>
  );
}