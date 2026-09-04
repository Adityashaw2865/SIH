/**
 * Speech-to-text using OpenAI's Whisper model, run locally via
 * @xenova/transformers (a pure JS/WASM port — no Python, no API key,
 * no external network call once the model is downloaded once).
 *
 * The model downloads automatically on first use (~75MB for "whisper-tiny",
 * cached in node_modules/.cache afterwards) and then runs completely
 * offline. Free forever, no billing account required.
 *
 * Supported languages: this uses the multilingual Whisper checkpoint, so
 * Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Gujarati and English are
 * all supported out of the box — just pass the right language code.
 */
import { pipeline } from "@xenova/transformers";

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

// Lazy-load the model once, reuse for every request after that.
function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-small"
    );
  }
  return transcriberPromise;
}

/**
 * Transcribes a WAV/PCM audio buffer to text.
 * @param {Float32Array} audioData - mono, 16kHz PCM float32 samples
 * @param {string} language - MediKiosk language label, e.g. "Hindi"
 */
export async function transcribeAudio(audioData, language) {
  const transcriber = await getTranscriber();
  const whisperLang = LANG_TO_WHISPER[language] || "english";

  const result = await transcriber(audioData, {
    language: whisperLang,
    task: "transcribe"
  });

  return result.text?.trim() || "";
}
