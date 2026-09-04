import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import useTranslation from "../../i18n/useTranslation";

export default function PatientReview() {
  const navigate = useNavigate();
  const { patientId, patientName } = useIntake();
  const t = useTranslation().patientReview;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      setError(true);
      return;
    }
    api.get(`/api/patients/${patientId}/review`)
      .then(res => {
        const d = res.data.data;
        setSummary([
          { label: t.chiefComplaint, value: d.chiefComplaint || t.notRecorded },
          { label: t.duration, value: d.duration || t.notRecorded },
          { label: t.documentsAdded, value: `${d.documentsCount} document${d.documentsCount === 1 ? "" : "s"}` },
          { label: t.ayushAssessment, value: d.ayushCompleted ? t.completed : t.notDone }
        ]);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [patientId]);

  return <KioskShell step={7} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="max-w-lg w-full p-8 animate-rise">
          <h1 className="text-2xl font-extrabold text-ink mb-1">{t.title}</h1>
          <p className="text-ink-soft text-sm mb-6">{t.subtitleHi} {patientName || "there"}, {t.subtitleRest}</p>

          {loading && <div className="flex items-center justify-center gap-2 text-ink-soft text-sm py-8">
              <Loader2 size={18} className="animate-spin" /> {t.loadingDetails}
            </div>}

          {!loading && error && <div className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3 mb-6">
              {t.errorLoading}
            </div>}

          {!loading && !error && summary && <div className="space-y-3 mb-8">
              {summary.map(s => <div key={s.label} className="flex items-center justify-between bg-teal-light/30 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-ink-soft">{s.label}</span>
                  <span className="text-sm font-bold text-ink text-right">{s.value}</span>
                </div>)}
            </div>}

          <div className="flex items-center gap-2 text-success text-sm font-medium mb-6">
            <CheckCircle2 size={18} /> {t.readyMsg}
          </div>

          <Button size="lg" className="w-full" onClick={() => navigate("/patient/complete")}>
            {t.confirmSubmit}
          </Button>
        </Card>
      </div>
    </KioskShell>;
}