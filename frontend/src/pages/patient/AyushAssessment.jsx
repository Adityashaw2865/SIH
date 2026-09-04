import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Mic, Volume2 } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { ProgressBar } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import { useSpeechToText, useTextToSpeech, matchSpokenToOption } from "../../hooks/useSpeech";
import useTranslation from "../../i18n/useTranslation";

// Each question maps 1:1 to the classic Dashavidha Pariksha parameters, in order
const dashavidhaKeys = ["prakriti", "vikriti", "sara", "samhanana", "pramana", "satmya", "sattva", "aharaShakti", "vyayamaShakti", "vaya"];

// After Dashavidha Pariksha, capture Agni (digestive capacity), Koshtha
// (bowel nature), Nidana (causative factors), and a basic Ahara-Vihara
// (diet & lifestyle) assessment — all explicitly named in spec 1.1/3.3
// as part of AYUSH history-taking but previously missing from this formclea
// even though the backend schema (Patient.js) already had fields for them.
const extendedKeys = ["agni", "koshtha", "nidana", "ahara", "vihara"];

const questions = [{
  q: "How would you describe your usual body structure?",
  options: ["Thin / light frame", "Medium / muscular", "Broad / heavy frame"]
}, {
  q: "How is your appetite usually?",
  options: ["Variable, sometimes skip meals", "Strong, get hungry often", "Steady but slow"]
}, {
  q: "How would you describe your sleep?",
  options: ["Light, easily disturbed", "Moderate, sound sleep", "Deep, hard to wake up"]
}, {
  q: "How is your digestion generally?",
  options: ["Irregular / gas-prone", "Strong, sometimes acidity", "Slow, feels heavy"]
}, {
  q: "How do you usually respond to stress?",
  options: ["Anxious, restless", "Irritable, intense", "Calm, slow to react"]
}, {
  q: "How is your skin typically?",
  options: ["Dry, rough", "Warm, sensitive, prone to rashes", "Oily, smooth, cool"]
}, {
  q: "How would you describe your physical stamina?",
  options: ["Bursts of energy, tires quickly", "Moderate, good endurance", "High stamina, slow to tire"]
}, {
  q: "How is your voice/speech pattern?",
  options: ["Fast, talkative", "Sharp, clear, articulate", "Slow, steady, deep"]
}, {
  q: "How do you handle weather changes?",
  options: ["Dislike cold, prefer warmth", "Dislike heat, prefer cool", "Adapt well to most weather"]
}, {
  q: "How would you describe your memory?",
  options: ["Quick to learn, quick to forget", "Sharp and precise", "Slow to learn, doesn't forget"]
}];

// Agni, Koshtha, Nidana, Ahara-Vihara — Ayurvedic assessment beyond the
// 10 Dashavidha parameters (spec: "Agni (digestive capacity), Koshtha
// (bowel nature), Ahara-Vihara (diet and lifestyle), Nidana (causative
// factors)").
const extendedQuestions = [{
  q: "How would you rate your digestive fire (Agni)?",
  options: ["Weak — poor appetite, slow digestion", "Variable — irregular, unpredictable", "Sharp — strong, sometimes excessive hunger", "Balanced — regular and comfortable"]
}, {
  q: "How would you describe your bowel nature (Koshtha)?",
  options: ["Hard — prone to constipation", "Soft — prone to loose motions", "Regular / balanced"]
}, {
  q: "What do you feel triggered or worsened your current condition (Nidana)?",
  options: ["Diet / food habits", "Lifestyle / daily routine", "Stress / emotional factors", "Season / weather change", "Not sure"]
}, {
  q: "How would you describe your usual diet (Ahara)?",
  options: ["Mostly vegetarian, home-cooked", "Mixed diet, frequent outside food", "Irregular meal timings", "Spicy / oily food regularly"]
}, {
  q: "How would you describe your daily routine and lifestyle (Vihara)?",
  options: ["Active, regular exercise/yoga", "Sedentary, mostly seated work", "Irregular sleep-wake cycle", "High stress, little rest"]
}];

const allQuestions = [...questions, ...extendedQuestions];
const allKeys = [...dashavidhaKeys, ...extendedKeys];

export default function AyushAssessment() {
  const navigate = useNavigate();
  const { patientId, language } = useIntake();
  const t = useTranslation().ayushAssessment;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [voiceError, setVoiceError] = useState(null);
  const { listen, listening, error: sttError, supported: sttSupported } = useSpeechToText(language);
  const { speak, speaking, supported: ttsSupported } = useTextToSpeech();

  const answer = opt => {
    const newAnswers = {
      ...answers,
      [allKeys[index]]: opt
    };
    setAnswers(newAnswers);
    if (index + 1 < allQuestions.length) {
      setIndex(index + 1);
    } else {
      if (patientId) {
        api.post(`/api/patients/${patientId}/ayush`, newAnswers).catch(() => {});
      }
      navigate("/patient/documents");
    }
  };

  const current = allQuestions[index];

  const handleVoiceAnswer = async () => {
    setVoiceError(null);
    const transcript = await listen();
    if (!transcript) {
      if (sttError) setVoiceError(sttError);
      return;
    }
    const matched = matchSpokenToOption(transcript, current.options);
    if (matched) {
      answer(matched);
    } else {
      setVoiceError(`Heard "${transcript}" — couldn't match it to an option. Please try again or tap an answer.`);
    }
  };

  return <KioskShell step={5} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full animate-rise" key={index}>
          <div className="flex items-center gap-2 justify-center mb-4">
            <Leaf className="text-ayur" size={24} />
            <h1 className="text-xl font-extrabold text-ink">{t.title}</h1>
          </div>
          <p className="text-center text-sm text-ink-soft mb-6">
            {t.subtitle}
          </p>

          <p className="text-center text-xs font-semibold text-ayur mb-2">{t.progress}: {index + 1} / {allQuestions.length}</p>
          <ProgressBar value={(index + 1) / allQuestions.length * 100} tone="success" />

          <div className="mt-8 bg-ayur/5 border border-ayur/20 rounded-2xl p-6 mb-6">
            <p className="text-lg font-semibold text-ink text-center">{current.q}</p>
          </div>

          <div className="grid gap-3 mb-6">
            {current.options.map(opt => <button key={opt} onClick={() => answer(opt)} className="min-h-[52px] bg-white border-2 border-ayur/20 rounded-xl px-5 py-3 text-left font-semibold text-ink hover:border-ayur hover:bg-ayur/5 transition-colors">
                {opt}
              </button>)}
          </div>

          {voiceError && <div className="mb-4 bg-emergency/5 border border-emergency/20 rounded-xl px-4 py-2.5 text-xs font-medium text-emergency text-center">
              {voiceError}
            </div>}

          <div className="flex items-center justify-center gap-6 text-sm">
            <button onClick={handleVoiceAnswer} disabled={!sttSupported} className="inline-flex items-center gap-1.5 text-teal font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
              <Mic size={16} className={listening ? "animate-pulse-soft text-emergency" : ""} /> {listening ? t.listening : t.speak}
            </button>
            <button onClick={() => speak(current.q, language)} disabled={!ttsSupported || speaking} className="inline-flex items-center gap-1.5 text-teal font-semibold hover:underline disabled:opacity-40">
              <Volume2 size={16} className={speaking ? "animate-pulse-soft" : ""} /> {t.listen}
            </button>
          </div>
        </div>
      </div>
    </KioskShell>;
}