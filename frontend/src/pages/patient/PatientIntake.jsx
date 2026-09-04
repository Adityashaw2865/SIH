import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Check, Circle, AlertTriangle, Volume2 } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button, ProgressBar } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import { useSpeechToText, useTextToSpeech, matchSpokenToOption } from "../../hooks/useSpeech";
import useTranslation from "../../i18n/useTranslation";
import { QUESTION_HI, OPTION_HI, SECTION_HI, LANG_NATIVE_NAME } from "../../i18n/intakeQA";

const sections = ["Basic Information", "Chief Complaint", "History of Present Illness", "Past History", "Medication", "Allergies", "Family History", "Personal History", "Review of Systems"];

const chestPainFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "When did the pain start?",
  options: ["Just now", "Today", "1–7 days ago", "1–4 weeks ago", "More than a month ago"]
}, {
  section: "History of Present Illness",
  question: "Did the pain come on suddenly or gradually?",
  options: ["Suddenly", "Gradually"]
}, {
  section: "History of Present Illness",
  question: "Do you also have breathlessness?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Are you sweating more than usual right now?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Do you feel dizzy or light-headed?",
  options: ["Yes", "No"]
}, {
  section: "Past History",
  question: "Have you had any heart problems before?",
  options: ["Yes", "No", "Not sure"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

const feverFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "How long have you had the fever?",
  options: ["Today", "1–3 days", "4–7 days", "More than a week"]
}, {
  section: "History of Present Illness",
  question: "How high is the temperature?",
  options: ["Mild (below 100°F)", "Moderate (100–103°F)", "Above 103°F / 39.4°C", "Not measured"]
}, {
  section: "History of Present Illness",
  question: "Do you have neck stiffness?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Are you confused or unusually drowsy?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Do you have any new skin rash?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any chills, cough, or body aches along with the fever?",
  options: ["Chills", "Cough", "Body aches", "None of these"]
}, {
  section: "Past History",
  question: "Have you had any recent travel or contact with a sick person?",
  options: ["Yes", "No", "Not sure"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

const stomachPainFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "When did the pain start?",
  options: ["Just now", "Today", "1–7 days ago", "1–4 weeks ago", "More than a month ago"]
}, {
  section: "History of Present Illness",
  question: "Where is the pain located?",
  options: ["Upper abdomen", "Lower abdomen", "Right side", "Left side", "All over"]
}, {
  section: "History of Present Illness",
  question: "Is the pain rigid / board-like, or worse with movement?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Have you vomited blood or passed black/tarry stool?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Have you fainted or felt like losing consciousness?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any nausea, vomiting, or fever with the pain?",
  options: ["Nausea", "Vomiting", "Fever", "None of these"]
}, {
  section: "Past History",
  question: "Have you had any stomach or abdominal surgery before?",
  options: ["Yes", "No"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

const headacheFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "When did the headache start?",
  options: ["Just now", "Today", "1–7 days ago", "1–4 weeks ago", "More than a month ago"]
}, {
  section: "History of Present Illness",
  question: "Is this the sudden, worst headache of your life?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any weakness or numbness on one side of the body?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any slurred speech or trouble speaking?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any vision loss, blurred, or double vision?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "What makes the headache worse?",
  options: ["Light", "Noise", "Movement", "Not sure"]
}, {
  section: "Past History",
  question: "Have you had migraines or headaches like this before?",
  options: ["Yes", "No", "Not sure"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

const breathlessnessFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "When did the breathlessness start?",
  options: ["Just now", "Today", "1–7 days ago", "1–4 weeks ago", "More than a month ago"]
}, {
  section: "History of Present Illness",
  question: "Can you speak in full sentences without stopping to catch your breath?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Are your lips or fingertips looking blue or grey?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Is the breathlessness there even while sitting still (at rest)?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any chest pain or chest tightness along with the breathlessness?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any wheezing or noisy breathing?",
  options: ["Yes", "No"]
}, {
  section: "Past History",
  question: "Do you have asthma, COPD, or any heart condition?",
  options: ["Yes", "No", "Not sure"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines (e.g. an inhaler)?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

const weaknessFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "When did the weakness start?",
  options: ["Just now", "Within the last hour", "Today", "1–7 days ago", "More than a week ago"]
}, {
  section: "History of Present Illness",
  question: "Is the weakness on one side of the body (face, arm, or leg)?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any drooping or numbness on one side of the face?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any slurred speech or difficulty finding words?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any sudden vision changes or trouble seeing?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Any loss of balance or trouble walking?",
  options: ["Yes", "No"]
}, {
  section: "Past History",
  question: "Do you have high blood pressure, diabetes, or a previous stroke?",
  options: ["Yes", "No", "Not sure"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines (e.g. blood thinners)?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

const injuryFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "When did the injury happen?",
  options: ["Just now", "Within the last hour", "Today", "1–2 days ago", "More than 2 days ago"]
}, {
  section: "History of Present Illness",
  question: "Is there heavy or ongoing bleeding that won't stop?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Did you lose consciousness (pass out) after the injury?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "Is there an obvious deformity (bone out of place, joint looks wrong)?",
  options: ["Yes", "No"]
}, {
  section: "History of Present Illness",
  question: "How did the injury happen?",
  options: ["Fall", "Road accident", "Sports injury", "Sharp object / cut", "Other"]
}, {
  section: "Past History",
  question: "Are you on any blood-thinning medicines?",
  options: ["Yes", "No", "Not sure"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

const genericFlow = [{
  section: "Chief Complaint",
  question: "What problem brought you to the hospital today?",
  options: ["Chest pain", "Breathlessness", "Stomach pain", "Fever", "Headache", "Weakness / one-sided body weakness", "Injury / bleeding", "Knee / joint pain", "Something else"]
}, {
  section: "History of Present Illness",
  question: "How long have you had this problem?",
  options: ["Today", "1–7 days", "1–4 weeks", "1–6 months", "More than 6 months"]
}, {
  section: "History of Present Illness",
  question: "How severe is it?",
  options: ["Mild", "Moderate", "Severe"]
}, {
  section: "History of Present Illness",
  question: "What makes it worse?",
  options: ["Movement", "Rest", "Eating", "Not sure"]
}, {
  section: "Past History",
  question: "Do you have any long-term illnesses (diabetes, BP, etc.)?",
  options: ["Yes", "No"]
}, {
  section: "Medication",
  question: "Are you currently taking any medicines?",
  options: ["Yes", "No"]
}, {
  section: "Allergies",
  question: "Do you have any known allergies?",
  options: ["Yes", "No known allergies"]
}, {
  section: "Family History",
  question: "Any major illnesses that run in your family?",
  options: ["Yes", "No", "Not sure"]
}, {
  section: "Personal History",
  question: "Do you smoke or drink alcohol?",
  options: ["Neither", "Smoke", "Drink", "Both"]
}, {
  section: "Review of Systems",
  question: "Anything else you'd like to mention?",
  options: ["No, that's all", "Yes, one more thing"]
}];

export default function PatientIntake() {
  const navigate = useNavigate();
  const {
    patientName,
    patientId,
    language,
    redFlagTriggered,
    setRedFlagTriggered
  } = useIntake();
  const [flow, setFlow] = useState(chestPainFlow.slice(0, 1));
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [voiceError, setVoiceError] = useState(null);
  const [showExtraNote, setShowExtraNote] = useState(false);
  const [extraNoteText, setExtraNoteText] = useState("");
  const current = flow[stepIndex];
  const currentSectionIdx = sections.indexOf(current.section);
  const { listen, listening, error: sttError, supported: sttSupported } = useSpeechToText(language);
  const { speak, speaking, supported: ttsSupported } = useTextToSpeech();
  const t = useTranslation().patientIntake;

  const isHindi = language === "Hindi";
  const tq = text => isHindi ? (QUESTION_HI[text] || text) : text;
  const topt = text => isHindi ? (OPTION_HI[text] || text) : text;
  const tsection = text => isHindi ? (SECTION_HI[text] || text) : text;

  const chooseFlow = complaint => {
    if (complaint === "Chest pain") return chestPainFlow;
    if (complaint === "Breathlessness") return breathlessnessFlow;
    if (complaint === "Fever") return feverFlow;
    if (complaint === "Stomach pain") return stomachPainFlow;
    if (complaint === "Headache") return headacheFlow;
    if (complaint === "Weakness / one-sided body weakness") return weaknessFlow;
    if (complaint === "Injury / bleeding") return injuryFlow;
    return genericFlow;
  };

  const RED_FLAG_RULES = {
    "Chest pain": [
      { questionMatch: /breathless/i, answerEquals: "Yes" },
      { questionMatch: /sweating/i, answerEquals: "Yes" },
      { questionMatch: /dizzy|light-headed/i, answerEquals: "Yes" },
      { questionMatch: /suddenly or gradually/i, answerEquals: "Suddenly" }
    ],
    "Fever": [
      { questionMatch: /neck stiffness/i, answerEquals: "Yes" },
      { questionMatch: /confused or unusually drowsy/i, answerEquals: "Yes" },
      { questionMatch: /skin rash/i, answerEquals: "Yes" },
      { questionMatch: /how high|temperature/i, answerEquals: "Above 103°F / 39.4°C" }
    ],
    "Stomach pain": [
      { questionMatch: /vomited blood|black.*tarry stool/i, answerEquals: "Yes" },
      { questionMatch: /rigid.*board-like/i, answerEquals: "Yes" },
      { questionMatch: /fainted/i, answerEquals: "Yes" }
    ],
    "Headache": [
      { questionMatch: /sudden, worst headache/i, answerEquals: "Yes" },
      { questionMatch: /weakness or numbness/i, answerEquals: "Yes" },
      { questionMatch: /slurred speech/i, answerEquals: "Yes" },
      { questionMatch: /vision loss, blurred/i, answerEquals: "Yes" }
    ],
    "Breathlessness": [
      { questionMatch: /speak in full sentences/i, answerEquals: "No" },
      { questionMatch: /blue or grey/i, answerEquals: "Yes" },
      { questionMatch: /even while sitting still/i, answerEquals: "Yes" }
    ],
    "Weakness / one-sided body weakness": [
      { questionMatch: /one side of the body/i, answerEquals: "Yes" },
      { questionMatch: /drooping or numbness/i, answerEquals: "Yes" },
      { questionMatch: /slurred speech/i, answerEquals: "Yes" },
      { questionMatch: /sudden vision changes/i, answerEquals: "Yes" }
    ],
    "Injury / bleeding": [
      { questionMatch: /heavy or ongoing bleeding/i, answerEquals: "Yes" },
      { questionMatch: /lose consciousness/i, answerEquals: "Yes" },
      { questionMatch: /obvious deformity/i, answerEquals: "Yes" }
    ]
  };

  const isRedFlagAnswer = (complaint, question, value) => {
    const rules = RED_FLAG_RULES[complaint];
    if (!rules) return false;
    return rules.some(r => r.questionMatch.test(question) && value === r.answerEquals);
  };

  const answer = (value, inputMode = "tap") => {
    const newAnswers = {
      ...answers,
      [stepIndex]: value
    };
    setAnswers(newAnswers);

    if (patientId) {
      api.post(`/api/patients/${patientId}/answers`, {
        section: current.section,
        question: current.question,
        answer: value,
        inputMode
      }).catch(() => {});
    }

    let activeFlow = flow;
    if (stepIndex === 0) {
      activeFlow = chooseFlow(value);
      setFlow(activeFlow);
    }

    const complaint = newAnswers[0];
    if (isRedFlagAnswer(complaint, current.question, value)) {
      setRedFlagTriggered(true);
      return;
    }

    // "Yes, one more thing" opens a dedicated free-text/voice follow-up step
    // instead of silently doing the same thing as "No, that's all".
    if (value === "Yes, one more thing") {
      setShowExtraNote(true);
      return;
    }

    if (stepIndex + 1 < activeFlow.length) {
      setStepIndex(stepIndex + 1);
    } else {
      navigate("/patient/ayush");
    }
  };

  const submitExtraNote = () => {
    const note = extraNoteText.trim();
    if (note && patientId) {
      api.post(`/api/patients/${patientId}/answers`, {
        section: "Review of Systems",
        question: "Anything else you'd like to mention? (details)",
        answer: note,
        inputMode: "text"
      }).catch(() => {});
    }
    setShowExtraNote(false);
    navigate("/patient/ayush");
  };

  const handleExtraNoteVoice = async () => {
    setVoiceError(null);
    const transcript = await listen();
    if (!transcript) {
      if (sttError) setVoiceError(sttError);
      return;
    }
    setExtraNoteText(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  const handleVoiceAnswer = async () => {
    setVoiceError(null);
    const transcript = await listen();
    if (!transcript) {
      if (sttError) setVoiceError(sttError);
      return;
    }
    if (!current.options?.length) {
      answer(transcript, "voice");
      return;
    }
    const displayOptions = current.options.map(topt);
    const matchedLabel = matchSpokenToOption(transcript, displayOptions);
    if (matchedLabel) {
      const idx = displayOptions.indexOf(matchedLabel);
      const canonicalValue = idx >= 0 ? current.options[idx] : matchedLabel;
      answer(canonicalValue, "voice");
    } else {
      setVoiceError(t.voiceNoMatch.replace("{heard}", transcript));
    }
  };

  if (redFlagTriggered) {
    return <KioskShell>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <Card className="max-w-lg w-full p-8 text-center border-emergency/40 animate-rise">
            <div className="w-16 h-16 rounded-full bg-red-50 text-emergency flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-emergency mb-3">{t.priorityAlertTitle}</h1>
            <p className="text-ink font-medium mb-2">
              {t.priorityAlertBody}
            </p>
            <p className="text-ink-soft text-sm mb-6">{t.priorityAlertNote}</p>
            <div className="space-y-3">
              <Button variant="danger" size="lg" className="w-full" onClick={() => navigate("/triage/dashboard")}>
                {t.alertTriageBtn}
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={() => setRedFlagTriggered(false)}>
                {t.continueAssistedBtn}
              </Button>
            </div>
          </Card>
        </div>
      </KioskShell>;
  }

  return <KioskShell>
      <div className="flex-1 grid lg:grid-cols-[280px_1fr] gap-0">
        <aside className="hidden lg:block bg-white border-r border-teal-light p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft mb-4">{t.sidebarHeading}</p>
          <ul className="space-y-3">
            {sections.map((s, i) => <li key={s} className="flex items-center gap-2.5 text-sm">
                {i < currentSectionIdx ? <Check size={16} className="text-success shrink-0" /> : i === currentSectionIdx ? <span className="w-4 h-4 rounded-full bg-teal shrink-0 animate-pulse-soft" /> : <Circle size={16} className="text-slate-300 shrink-0" />}
                <span className={i === currentSectionIdx ? "font-semibold text-ink" : i < currentSectionIdx ? "text-ink-soft line-through" : "text-slate-400"}>
                  {tsection(s)}
                </span>
              </li>)}
            <li className="flex items-center gap-2.5 text-sm">
              <Circle size={16} className="text-slate-300 shrink-0" />
              <span className="text-slate-400">{t.ayushSidebarItem}</span>
            </li>
          </ul>
        </aside>

        <div className="flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-xl w-full">
            <p className="text-xs font-semibold text-ink-soft mb-2">{patientName || t.patientFallback} · {LANG_NATIVE_NAME[language] || language}</p>
            <ProgressBar value={(stepIndex + 1) / flow.length * 100} />
            <div className="mt-8 bg-teal-light/40 rounded-2xl p-6 mb-6 animate-rise" key={showExtraNote ? "extra-note" : stepIndex}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-teal mb-2">{t.aiLabel}</p>
                  <p className="text-xl font-semibold text-ink">
                    {showExtraNote ? "Please tell us what else you'd like to mention" : tq(current.question)}
                  </p>
                </div>
                {ttsSupported && !showExtraNote && <button onClick={() => speak(tq(current.question), language)} className="shrink-0 w-9 h-9 rounded-full bg-white text-teal flex items-center justify-center hover:bg-teal-light" aria-label={t.listenAria} disabled={speaking}>
                    <Volume2 size={18} className={speaking ? "animate-pulse-soft" : ""} />
                  </button>}
              </div>
            </div>

            {voiceError && <div className="mb-4 bg-emergency/5 border border-emergency/20 rounded-xl px-4 py-2.5 text-xs font-medium text-emergency text-center">
                {voiceError}
              </div>}

            {showExtraNote ? <div>
                <textarea
                  value={extraNoteText}
                  onChange={e => setExtraNoteText(e.target.value)}
                  placeholder="Type here, or use the mic to speak..."
                  rows={4}
                  className="w-full rounded-xl border-2 border-teal-light px-4 py-3 text-ink font-medium mb-4 focus:outline-none focus:border-teal"
                />
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button onClick={handleExtraNoteVoice} disabled={!sttSupported || listening} className="w-16 h-16 rounded-full bg-teal text-white flex items-center justify-center shadow-soft hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed" aria-label={t.speakAria}>
                    <Mic size={26} />
                  </button>
                </div>
                {listening && <p className="text-center text-sm text-ink-soft mb-4">{t.listening}</p>}
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="secondary" size="lg" onClick={submitExtraNote}>
                    Skip
                  </Button>
                  <Button size="lg" onClick={submitExtraNote} disabled={!extraNoteText.trim()}>
                    Submit &amp; continue
                  </Button>
                </div>
              </div> : listening ? <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emergency/10 text-emergency flex items-center justify-center mx-auto mb-3 animate-pulse-soft">
                  <Mic size={28} />
                </div>
                <p className="font-semibold text-ink">{t.listening}</p>
                <div className="flex items-center justify-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map(i => <span key={i} className="w-1.5 bg-teal rounded-full animate-pulse-soft" style={{
                height: `${8 + i % 3 * 8}px`,
                animationDelay: `${i * 0.1}s`
              }} />)}
                </div>
              </div> : <>
                {current.options && <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {current.options.map(opt => <button key={opt} onClick={() => answer(opt)} className="min-h-[52px] bg-white border-2 border-teal-light rounded-xl px-5 py-3 text-left font-semibold text-ink hover:border-teal hover:bg-teal-light/30 transition-colors">
                        {topt(opt)}
                      </button>)}
                  </div>}
                <div className="flex items-center justify-center gap-4">
                  <button onClick={handleVoiceAnswer} disabled={!sttSupported} className="w-16 h-16 rounded-full bg-teal text-white flex items-center justify-center shadow-soft hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed" aria-label={t.speakAria}>
                    <Mic size={26} />
                  </button>
                </div>
                <p className="text-center text-xs text-ink-soft mt-4">
                  {sttSupported ? t.voiceHintSupported : t.voiceHintUnsupported}
                </p>
              </>}
          </div>
        </div>
      </div>
    </KioskShell>;
}