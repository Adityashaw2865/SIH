import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import { useTextToSpeech } from "../../hooks/useSpeech";
import useTranslation from "../../i18n/useTranslation";
// FIX: import the list of languages that actually have a full text
// translation, so we can mark the rest honestly instead of silently
// falling back to English while implying full support.
import { SUPPORTED_TRANSLATION_LANGUAGES } from "../../i18n/translations";

const languages = [
  { code: "hi", label: "हिंदी", en: "Hindi", flag: "🇮🇳" },
  { code: "en", label: "English", en: "English", flag: "🇬🇧" },
  { code: "bn", label: "বাংলা", en: "Bengali", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", en: "Marathi", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", en: "Tamil", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", en: "Telugu", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ", en: "Kannada", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી", en: "Gujarati", flag: "🇮🇳" }
].map(l => ({
  ...l,
  // FIX: true only for languages with a real translation dictionary entry
  fullySupported: SUPPORTED_TRANSLATION_LANGUAGES.includes(l.en)
}));

export default function LanguageSelect() {
  const navigate = useNavigate();
  const {
    setLanguage
  } = useIntake();
  const { speak } = useTextToSpeech();
  const t = useTranslation().languageSelect;
  const choose = l => {
    setLanguage(l);
    navigate("/patient/consent");
  };
  return <KioskShell step={1} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full animate-rise">
          <h1 className="text-3xl font-extrabold text-ink text-center mb-8">{t.title}</h1>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {languages.map(l => <Card key={l.code} className="p-5 text-center cursor-pointer hover:shadow-soft hover:border-teal transition-all relative" onClick={() => choose(l.en)}>
                {/* FIX: honest badge instead of a silent English fallback */}
                {!l.fullySupported && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    Voice only
                  </span>
                )}
                <p className="text-2xl mb-2">{l.flag}</p>
                <p className="font-bold text-ink text-lg">{l.label}</p>
                <p className="text-xs text-ink-soft mb-3">{l.en}</p>
                <button onClick={e => {
                  e.stopPropagation();
                  speak(l.label, l.en);
                }} className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline">
                  <Volume2 size={14} /> Hear this option
                </button>
              </Card>)}
          </div>
        </div>
      </div>
    </KioskShell>;
}