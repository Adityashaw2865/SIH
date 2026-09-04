import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import useTranslation from "../../i18n/useTranslation";

export default function PatientComplete() {
  const { patientId, resetSession } = useIntake();
  const t = useTranslation().patientComplete;

  useEffect(() => {
    if (patientId) {
      api.post(`/api/patients/${patientId}/complete`)
        .catch(() => {})
        .finally(() => resetSession());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <KioskShell step={8} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="max-w-md w-full p-8 text-center animate-rise">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink mb-3">{t.title}</h1>
          <p className="text-ink-soft mb-6">
            {t.message}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-ink-soft mb-8">
            <ShieldCheck size={16} className="text-teal" /> {t.encrypted}
          </div>
          <Link to="/home">
            <Button size="lg" className="w-full">{t.finish}</Button>
          </Link>
        </Card>
      </div>
    </KioskShell>
  );
}