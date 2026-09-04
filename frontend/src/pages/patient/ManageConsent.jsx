import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import useTranslation from "../../i18n/useTranslation";

// Lets a patient revisit their consent choices at any point during their
// kiosk session — not just at the very start — and REVOKE any consent
// they previously gave. This is the missing half of "granular, revocable
// consent" from spec 3.3 Module D: the initial Consent.jsx screen only
// let a patient grant consent once; there was no way back in afterward.
//
// Revoking "History Capture" mid-session is a meaningful action, so the
// patient is warned about what stopping consent means for their visit
// (rather than silently disabling something they're relying on).
export default function ManageConsent() {
  const navigate = useNavigate();
  const { patientId, consentFlags, setConsentFlags } = useIntake();
  const t = useTranslation().manageConsent;

  const CONSENT_ITEMS = [
    { key: "historyCapture", label: t.historyCapture, description: t.historyCaptureDesc },
    { key: "documentProcessing", label: t.documentProcessing, description: t.documentProcessingDesc },
    { key: "providerSharing", label: t.sharing, description: t.sharingDesc }
  ];

  const [checks, setChecks] = useState(consentFlags);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggle = key => setChecks(c => ({ ...c, [key]: !c[key] }));

  const anyRevoked = CONSENT_ITEMS.some(item => consentFlags[item.key] && !checks[item.key]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (patientId) {
        await api.post(`/api/patients/${patientId}/consent`, checks);
      }
      setConsentFlags(checks);
      setSaved(true);
    } catch {
      setError("Could not update your consent right now. Please ask a staff member for help.");
    } finally {
      setSaving(false);
    }
  };

  return <KioskShell step={0} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-xl w-full animate-rise">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2 justify-center mb-2">
            <ShieldCheck className="text-teal" size={24} />
            <h1 className="text-2xl font-extrabold text-ink">{t.title}</h1>
          </div>
          <p className="text-ink-soft text-center text-sm mb-8">
            {t.subtitle}
          </p>

          <Card className="p-6">
            <div className="space-y-3 mb-6">
              {CONSENT_ITEMS.map(item => <label key={item.key} className="flex items-start gap-3 bg-teal-light/30 rounded-xl px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checks[item.key]}
                    onChange={() => toggle(item.key)}
                    className="w-5 h-5 accent-teal mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{item.label}</span>
                    <span className="block text-xs text-ink-soft">{item.description}</span>
                  </span>
                </label>)}
            </div>

            {anyRevoked && <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{t.revokedWarning}</span>
              </div>}

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            {saved
              ? <div className="text-center py-2">
                  <p className="font-semibold text-success mb-3">{t.updated}</p>
                  <Button size="lg" className="w-full" onClick={() => navigate(-1)}>{t.continueBtn}</Button>
                </div>
              : <Button size="lg" className="w-full" onClick={save} disabled={saving}>
                  {saving ? t.savingBtn : t.saveChanges}
                </Button>}
          </Card>
        </div>
      </div>
    </KioskShell>;
}