import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, ShieldCheck } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import { useTextToSpeech } from "../../hooks/useSpeech";
import useTranslation from "../../i18n/useTranslation";

export default function Consent() {
  const navigate = useNavigate();
  const {
    setConsentGiven,
    setConsentFlags,
    language
  } = useIntake();
  const { speak } = useTextToSpeech();
  // FIX: this page was fully hardcoded in English (title, list items,
  // checkbox labels, buttons) and never used the translation system —
  // so it stayed in English no matter which language the patient picked
  // on the LanguageSelect screen. Now it pulls everything from `t`.
  const t = useTranslation().consent;
  const [checks, setChecks] = useState({
    history: false,
    docs: false,
    sharing: false
  });
  const allChecked = checks.history && checks.docs && checks.sharing;
  const toggle = k => setChecks(c => ({
    ...c,
    [k]: !c[k]
  }));
  const proceed = () => {
    setConsentGiven(true);
    setConsentFlags({
      historyCapture: checks.history,
      documentProcessing: checks.docs,
      providerSharing: checks.sharing
    });
    navigate("/patient/identity");
  };
  const consentCheckboxes = [
    { key: "history", label: t.consentHistory },
    { key: "docs", label: t.consentDocs },
    { key: "sharing", label: t.consentSharing }
  ];
  return <KioskShell step={2} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <Card className="max-w-2xl w-full p-8 animate-rise">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-teal" size={28} />
            <h1 className="text-2xl font-extrabold text-ink">{t.title}</h1>
          </div>
          <p className="text-ink-soft mb-6">
            {t.intro}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="font-semibold text-ink mb-2 text-sm">{t.whatWeCollect}</p>
              <ul className="text-sm text-ink-soft space-y-1 list-disc pl-4">
                {t.collectItems.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink mb-2 text-sm">{t.whyWeCollect}</p>
              <ul className="text-sm text-ink-soft space-y-1 list-disc pl-4">
                {t.whyItems.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>

          <p className="font-semibold text-ink mb-3 text-sm">{t.choicesTitle}</p>
          <div className="space-y-3 mb-6">
            {consentCheckboxes.map(c => <label key={c.key} className="flex items-center gap-3 bg-teal-light/30 rounded-xl px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={checks[c.key]} onChange={() => toggle(c.key)} className="w-5 h-5 accent-teal" />
                <span className="text-sm font-medium text-ink">{c.label}</span>
              </label>)}
          </div>

          <button onClick={() => speak(t.intro, language)} className="inline-flex items-center gap-2 text-teal font-semibold text-sm hover:underline mb-4">
            <Volume2 size={16} /> {t.listen}
          </button>

          <p className="text-xs text-ink-soft mb-6">{t.revokeNote}</p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" disabled={!allChecked} onClick={proceed}>
              {t.understand}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/help")}>
              {t.needAssistance}
            </Button>
          </div>
        </Card>
      </div>
    </KioskShell>;
}