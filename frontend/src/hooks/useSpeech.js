import { useCallback, useRef, useState } from "react";

// Full language names used throughout the app (IntakeContext / LanguageSelect)
// mapped to BCP-47 tags for the Web Speech API.
const LANGUAGE_CODES = {
  Hindi: "hi-IN",
  English: "en-IN",
  Bengali: "bn-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
  Gujarati: "gu-IN"
};

function resolveLangCode(language) {
  return LANGUAGE_CODES[language] || "en-IN";
}

// ---------------------------------------------------------------------
// Speech-to-text (microphone -> transcript), backed by the browser's
// SpeechRecognition API. `listen()` starts one recognition pass and
// resolves with the transcript once the user stops speaking (or null on
// error/timeout), so callers can just `await listen()`.
// ---------------------------------------------------------------------
export function useSpeechToText(language) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SpeechRecognition;

  const listen = useCallback(() => {
    if (!supported) {
      setError("Voice input isn't supported in this browser.");
      return Promise.resolve(null);
    }
    if (listening) {
      return Promise.resolve(null);
    }

    return new Promise(resolve => {
      const recognition = new SpeechRecognition();
      recognition.lang = resolveLangCode(language);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        setListening(false);
        resolve(value);
      };

      recognition.onstart = () => {
        setError(null);
        setListening(true);
      };
      recognition.onresult = event => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || null;
        finish(transcript);
      };
      recognition.onerror = event => {
        setError(
          event.error === "no-speech"
            ? "Didn't catch that — please try again."
            : "Couldn't access the microphone. Please check permissions."
        );
        finish(null);
      };
      recognition.onend = () => finish(null);

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setError("Couldn't start voice input. Please try again.");
        finish(null);
      }
    });
  }, [language, listening, supported, SpeechRecognition]);

  return { listen, listening, error, supported };
}

// ---------------------------------------------------------------------
// Text-to-speech, backed by the browser's SpeechSynthesis API.
// `speak(text, language)` reads the given text aloud in the given
// full language name (e.g. "Hindi").
// ---------------------------------------------------------------------
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback((text, language) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel(); // don't stack utterances
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = resolveLangCode(language);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  return { speak, speaking, supported };
}

// ---------------------------------------------------------------------
// Matches a raw spoken transcript against a fixed list of tap-able
// options (e.g. "Yes" / "No" / "Suddenly" / "Gradually"), so a patient
// can answer a multiple-choice question by voice. Tries, in order:
//   1. exact (case-insensitive) match
//   2. transcript containing the option, or option containing the transcript
//   3. best word-overlap score, if it clears a minimum threshold
// Returns the matched option string, or null if nothing matched well.
// ---------------------------------------------------------------------
function normalize(str) {
  return str.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}

export function matchSpokenToOption(transcript, options) {
  if (!transcript || !Array.isArray(options) || !options.length) return null;
  const normTranscript = normalize(transcript);
  if (!normTranscript) return null;

  // 1. Exact match
  const exact = options.find(opt => normalize(opt) === normTranscript);
  if (exact) return exact;

  // 2. Substring match either direction
  const substring = options.find(opt => {
    const normOpt = normalize(opt);
    return normOpt && (normTranscript.includes(normOpt) || normOpt.includes(normTranscript));
  });
  if (substring) return substring;

  // 3. Word-overlap scoring
  const transcriptWords = new Set(normTranscript.split(/\s+/).filter(Boolean));
  let best = null;
  let bestScore = 0;
  for (const opt of options) {
    const optWords = normalize(opt).split(/\s+/).filter(Boolean);
    if (!optWords.length) continue;
    const overlap = optWords.filter(w => transcriptWords.has(w)).length;
    const score = overlap / optWords.length;
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }
  return bestScore >= 0.5 ? best : null;
}