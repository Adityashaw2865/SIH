import { useNavigate } from "react-router-dom";
import { UserPlus, UserCheck, Users, Headphones } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card } from "../../components/ui";
import useTranslation from "../../i18n/useTranslation";

export default function PatientStart() {
  const navigate = useNavigate();
  const t = useTranslation().patientStart;
  const options = [{
    icon: UserPlus,
    title: t.newPatientTitle,
    desc: t.newPatientDesc,
    to: "/patient/language"
  }, {
    icon: UserCheck,
    title: t.existingPatientTitle,
    desc: t.existingPatientDesc,
    to: "/patient/language"
  }, {
    icon: Users,
    title: t.assistedTitle,
    desc: t.assistedDesc,
    to: "/patient/language"
  }];
  return <KioskShell>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center animate-rise">
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink mb-3">{t.welcome}</h1>
          <p className="text-ink-soft text-lg mb-10">{t.subtitle}</p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {options.map(o => <Card key={o.title} className="p-6 text-left cursor-pointer hover:shadow-soft hover:border-teal transition-all" onClick={() => navigate(o.to)}>
                <div className="w-11 h-11 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-4">
                  <o.icon size={22} />
                </div>
                <p className="font-bold text-ink mb-1">{o.title}</p>
                <p className="text-sm text-ink-soft">{o.desc}</p>
              </Card>)}
          </div>
          <button onClick={() => navigate("/help")} className="inline-flex items-center gap-2 text-teal font-semibold text-sm hover:underline">
            <Headphones size={18} /> {t.needHelp}
          </button>
        </div>
      </div>
    </KioskShell>;
}