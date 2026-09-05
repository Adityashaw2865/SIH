// FULL FILE: frontend/src/hooks/useSpeech.js
import { useCallback, useRef, useState } from "react";
import api from "../services/api";

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
// Fallback recorder for browsers/devices without window.SpeechRecognition
// (e.g. Firefox, many non-Chrome mobile browsers). Records raw PCM via
// the Web Audio API, encodes it as a 16-bit mono WAV, and posts it to
// the backend's /api/speech/transcribe endpoint, which runs a real
// offline multilingual Whisper model (see services/speechService.js) —
// so voice input still works, just via the server instead of the
// browser's built-in (Chrome-only, Google-cloud-backed) recognizer.
// ---------------------------------------------------------------------
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

async function recordAndTranscribeViaServer(language, stopSignal) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const chunks = [];

  source.connect(processor);
  processor.connect(audioContext.destination);
  processor.onaudioprocess = (e) => {
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };

  // Record until the caller signals stop (e.g. user releases a
  // push-to-talk button), capped at 20s so a forgotten mic doesn't
  // record forever.
  await new Promise((resolve) => {
    const maxTimer = setTimeout(resolve, 20000);
    stopSignal.then(() => {
      clearTimeout(maxTimer);
      resolve();
    });
  });

  processor.disconnect();
  source.disconnect();
  stream.getTracks().forEach((t) => t.stop());
  const sampleRate = audioContext.sampleRate;
  await audioContext.close();

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Float32Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    merged.set(c, pos);
    pos += c.length;
  }

  const wavBlob = encodeWav(merged, sampleRate);
  const formData = new FormData();
  formData.append("audio", wavBlob, "speech.wav");
  formData.append("language", language);

  const { data } = await api.post("/api/speech/transcribe", formData);
  return data?.data?.transcript || null;
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
  const stopFallbackRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const hasBrowserRecognition = !!SpeechRecognition;
  const hasMicCapture =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== "undefined" &&
    !!(window.AudioContext || window.webkitAudioContext);

  // "supported" now covers both paths: native browser recognition where
  // available, falling back to server-side (Whisper) transcription
  // everywhere a microphone can be captured. Voice input therefore only
  // becomes unavailable where there is no mic access at all.
  const supported = hasBrowserRecognition || hasMicCapture;

  // For the fallback path only: stops the in-progress recording and lets
  // it resolve with whatever was captured so far. No-op otherwise.
  const stopListening = useCallback(() => {
    stopFallbackRef.current?.();
  }, []);

  const listen = useCallback(() => {
    if (listening) {
      return Promise.resolve(null);
    }

    if (!hasBrowserRecognition) {
      if (!hasMicCapture) {
        setError("Voice input isn't supported on this device.");
        return Promise.resolve(null);
      }
      // Fallback: record via the mic and transcribe on the server.
      setError(null);
      setListening(true);
      let releaseStop;
      const stopSignal = new Promise((resolve) => { releaseStop = resolve; });
      stopFallbackRef.current = releaseStop;

      return recordAndTranscribeViaServer(language, stopSignal)
        .then((transcript) => {
          setListening(false);
          stopFallbackRef.current = null;
          return transcript;
        })
        .catch(() => {
          setError("Couldn't access the microphone, or the server couldn't transcribe. Please try again.");
          setListening(false);
          stopFallbackRef.current = null;
          return null;
        });
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
  }, [language, listening, hasBrowserRecognition, hasMicCapture, SpeechRecognition]);

  // stopListening only matters for the fallback (server-transcribe) path —
  // native SpeechRecognition already stops itself on silence. Callers that
  // only use the browser path can safely ignore it.
  return { listen, listening, error, supported, stopListening, usingServerFallback: !hasBrowserRecognition && hasMicCapture };
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