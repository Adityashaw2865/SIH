/**
 * Speech-to-text — facade over two backends:
 *
 *   1. REAL Bhashini/AI4Bharat pipeline (services/bhashiniService.js) —
 *      used automatically when BHASHINI_USER_ID + BHASHINI_API_KEY are
 *      set. This is the actual government ASR platform named in the
 *      problem statement, purpose-built for Indian languages/accents.
 *
 *   2. Local Whisper (via @xenova/transformers, pure JS/WASM, no API
 *      key, fully offline after the one-time model download) — used
 *      whenever Bhashini isn't configured, or as an automatic fallback
 *      if a live Bhashini call fails (e.g. transient network issue),
 *      so the kiosk never goes fully silent on ASR.
 *
 * routes/speech.js only calls transcribeAudio(audioData, language) and
 * doesn't need to know which backend served the request.
 */
import { pipeline } from "@xenova/transformers";
import { isBhashiniConfigured, transcribeWithBhashini } from "./bhashiniService.js";

// Map MediKiosk's language labels to Whisper's language codes.
export const LANG_TO_WHISPER = {
  Hindi: "hindi",
  English: "english",
  Bengali: "bengali",
  Marathi: "marathi",
  Tamil: "tamil",
  Telugu: "telugu",
  Kannada: "kannada",
  Gujarati: "gujarati"
};

let transcriberPromise = null;

// Lazy-load the Whisper model once, reuse for every request after that.
function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-small"
    );
  }
  return transcriberPromise;
}

async function transcribeWithWhisper(audioData, language) {
  const transcriber = await getTranscriber();
  const whisperLang = LANG_TO_WHISPER[language] || "english";
  const result = await transcriber(audioData, {
    language: whisperLang,
    task: "transcribe"
  });
  return result.text?.trim() || "";
}

/**
 * Transcribes a mono, 16kHz PCM float32 audio buffer to text.
 * @param {Float32Array} audioData
 * @param {string} language - MediKiosk language label, e.g. "Hindi"
 */
export async function transcribeAudio(audioData, language) {
  if (isBhashiniConfigured()) {
    try {
      return await transcribeWithBhashini(audioData, language);
    } catch (err) {
      console.error("Bhashini ASR failed, falling back to local Whisper:", err.message);
      // fall through to Whisper below rather than failing the request
    }
  }
  return transcribeWithWhisper(audioData, language);
}