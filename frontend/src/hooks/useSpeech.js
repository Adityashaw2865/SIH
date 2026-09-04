import { useCallback, useRef, useState } from "react";

// Map MediKiosk's language labels (from LanguageSelect.jsx) to BCP-47 locale
// codes understood by the browser's SpeechSynthesis API.
export const LANG_TO_BCP47 = {
  Hindi: "hi-IN",
  English: "en-IN",
  Bengali: "bn-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
  Gujarati: "gu-IN"
};

// Backend base URL — reuse the same one the rest of the app talks to.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function encodeWav(audioBuffer) {
  // Encode a mono Float32 AudioBuffer as a 16-bit PCM WAV Blob.
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Speech-to-text via a self-hosted Whisper model on the backend
 * (see backend/src/services/speechService.js) — free, no API key, no
 * external billing account. Records the mic with MediaRecorder, sends the
 * captured audio to POST /api/speech/transcribe, and returns the transcript.
 *
 * This replaces the browser's built-in SpeechRecognition, which had
 * inconsistent accuracy for Indian languages and only worked in
 * Chrome/Edge.
 */
export function useSpeechToText(language) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const supported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== "undefined";

  const listen = useCallback(() => {
    return new Promise(async (resolve) => {
      if (!supported) {
        setError("Voice input isn't supported in this browser. Please tap an answer instead.");
        resolve(null);
        return;
      }
      setError(null);

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError("Microphone access was blocked. Please allow it or tap an answer.");
        resolve(null);
        return;
      }
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setListening(false);
        try {
          const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
          const arrayBuf = await blob.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(arrayBuf);
          const wavBlob = encodeWav(decoded);

          const formData = new FormData();
          formData.append("audio", wavBlob, "speech.wav");
          formData.append("language", language || "English");

          const res = await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: "POST",
            body: formData
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error || "Transcription failed");
          resolve(json.data.transcript || null);
        } catch {
          setError("Couldn't hear that clearly. Please try again or tap an answer.");
          resolve(null);
        } finally {
          audioCtx.close();
        }
      };

      setListening(true);
      recorder.start();
      // Auto-stop after 6 seconds of recording (one intake answer at a time)
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 6000);
    });
  }, [language, supported]);

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setListening(false);
  }, []);

  return { listen, cancel, listening, error, supported };
}

/**
 * Picks the best available SpeechSynthesis voice for a given BCP-47 locale.
 * Falls back progressively: exact locale -> same language family (e.g. any
 * "hi-*" for "hi-IN") -> English -> browser default (undefined lang, whatever
 * voice the browser picks). This prevents silent failures on machines that
 * don't have every Indian-language voice installed (common on fresh
 * Windows/macOS/Brave/Chrome setups) — something always gets spoken instead
 * of nothing happening.
 */
function pickVoiceAndLang(targetLang) {
  const voices = typeof window !== "undefined" && window.speechSynthesis
    ? window.speechSynthesis.getVoices()
    : [];

  if (!voices.length) {
    // Voices not loaded yet (common on first call) — just use the target
    // lang and let the browser's default voice handle it.
    return { voice: null, lang: targetLang };
  }

  // 1. Exact match, e.g. "hi-IN"
  let voice = voices.find(v => v.lang === targetLang);
  if (voice) return { voice, lang: targetLang };

  // 2. Same language family, e.g. any "hi-*" voice for "hi-IN"
  const langPrefix = targetLang.split("-")[0];
  voice = voices.find(v => v.lang.startsWith(langPrefix + "-") || v.lang === langPrefix);
  if (voice) return { voice, lang: voice.lang };

  // 3. Fall back to English (India, then any English)
  voice = voices.find(v => v.lang === "en-IN") || voices.find(v => v.lang.startsWith("en"));
  if (voice) return { voice, lang: voice.lang, fellBackToEnglish: true };

  // 4. Last resort — whatever the first available voice is
  return { voice: voices[0], lang: voices[0]?.lang || targetLang, fellBackToEnglish: true };
}

/**
 * Text-to-speech via the browser's built-in SpeechSynthesis API — free,
 * no API key. Used to read questions / confirmations aloud for low-literacy
 * or visually-impaired patients.
 *
 * Includes a voice-availability fallback (see pickVoiceAndLang above) so
 * that on devices missing a specific Indian-language voice pack, the app
 * still speaks (in English) instead of silently doing nothing — this can
 * otherwise look like a broken feature during a demo on an unfamiliar machine.
 */
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback((text, language) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();

    const targetLang = LANG_TO_BCP47[language] || "en-IN";
    const { voice, lang, fellBackToEnglish } = pickVoiceAndLang(targetLang);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setUsedFallback(!!fellBackToEnglish);
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported, usedFallback };
}

/**
 * Matches a raw spoken transcript against a fixed set of on-screen options
 * (e.g. "Yes" / "No" / "Chest pain"). Uses simple normalized substring
 * matching, which is reliable enough for short clinical-intake answers.
 */
export function matchSpokenToOption(transcript, options) {
  if (!transcript || !options?.length) return null;
  const norm = (s) => s.toLowerCase().trim().replace(/[^\w\s]/g, "");
  const heard = norm(transcript);
  // Exact or substring match first
  let match = options.find((opt) => norm(opt) === heard) || options.find((opt) => heard.includes(norm(opt)) || norm(opt).includes(heard));
  if (match) return match;
  // Word-overlap fallback: pick option sharing the most words with what was heard
  const heardWords = new Set(heard.split(/\s+/).filter(Boolean));
  let best = null;
  let bestScore = 0;
  for (const opt of options) {
    const optWords = norm(opt).split(/\s+/).filter(Boolean);
    const score = optWords.filter((w) => heardWords.has(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }
  return bestScore > 0 ? best : null;
}