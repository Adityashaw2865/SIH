/**
 * Real Bhashini (Digital India / MeitY) ASR client.
 * ---------------------------------------------------------------------
 * Bhashini is the government's actual Indian-language AI pipeline
 * platform (built on AI4Bharat models) — the ASR provider named
 * explicitly in the problem statement. This talks to the REAL Bhashini
 * inference API once you have a free API key from https://bhashini.gov.in
 *
 * Flow (matches Bhashini's published two-step "pipeline" API):
 *   1. POST to the NMT/config endpoint with the desired task
 *      (asr) + source language to get back a task-specific callback
 *      URL + auth token (the "pipeline config" step).
 *   2. POST the base64 audio to that callback URL to get the transcript
 *      (the "compute" step).
 *
 * Not configured (no BHASHINI_USER_ID / BHASHINI_API_KEY) → this module
 * is simply not called; speechService.js falls back to the local
 * Whisper model instead. See speechService.js for the switch logic.
 */

const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";
const USER_ID = process.env.BHASHINI_USER_ID;
const API_KEY = process.env.BHASHINI_API_KEY;
// Bhashini's published pipeline id for the standard ASR task chain.
const PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || "64392f96daac500b55c543cd";

// MediKiosk's language labels -> BCP-47 codes Bhashini expects.
const LANG_TO_BHASHINI = {
  Hindi: "hi",
  English: "en",
  Bengali: "bn",
  Marathi: "mr",
  Tamil: "ta",
  Telugu: "te",
  Kannada: "kn",
  Gujarati: "gu",
  Malayalam: "ml",
  Punjabi: "pa",
  Odia: "or"
};

export function isBhashiniConfigured() {
  return Boolean(USER_ID && API_KEY);
}

/**
 * Transcribes 16kHz mono PCM audio via the real Bhashini ASR pipeline.
 * @param {Float32Array} audioData
 * @param {string} language - MediKiosk language label, e.g. "Hindi"
 * @returns {Promise<string>}
 */
export async function transcribeWithBhashini(audioData, language) {
  const langCode = LANG_TO_BHASHINI[language] || "en";
  const base64Wav = floatPcmToBase64Wav(audioData, 16000);

  // Step 1 — ask Bhashini which model/service to use for this language
  // and get a signed callback URL + inference API key for it.
  const configRes = await fetch(CONFIG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      userID: USER_ID,
      ulcaApiKey: API_KEY
    },
    body: JSON.stringify({
      pipelineTasks: [{ taskType: "asr", config: { language: { sourceLanguage: langCode } } }],
      pipelineRequestConfig: { pipelineId: PIPELINE_ID }
    })
  });

  if (!configRes.ok) {
    throw new BhashiniError("CONFIG_FAILED", `Bhashini pipeline config failed (${configRes.status})`);
  }
  const config = await configRes.json();

  const asrConfig = config.pipelineResponseConfig?.find(c => c.taskType === "asr")?.config?.[0];
  const callbackUrl = config.pipelineInferenceAPIEndPoint?.callbackUrl;
  const inferenceApiKey = config.pipelineInferenceAPIEndPoint?.inferenceApiKey;

  if (!asrConfig || !callbackUrl || !inferenceApiKey) {
    throw new BhashiniError("CONFIG_INCOMPLETE", "Bhashini did not return a usable ASR pipeline for this language.");
  }

  // Step 2 — send the actual audio to the model endpoint it gave us.
  const computeRes = await fetch(callbackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [inferenceApiKey.name]: inferenceApiKey.value
    },
    body: JSON.stringify({
      pipelineTasks: [{
        taskType: "asr",
        config: {
          language: { sourceLanguage: langCode },
          serviceId: asrConfig.serviceId,
          audioFormat: "wav",
          samplingRate: 16000
        }
      }],
      inputData: { audio: [{ audioContent: base64Wav }] }
    })
  });

  if (!computeRes.ok) {
    throw new BhashiniError("INFERENCE_FAILED", `Bhashini ASR inference failed (${computeRes.status})`);
  }
  const result = await computeRes.json();
  const transcript = result.pipelineResponse?.find(r => r.taskType === "asr")?.output?.[0]?.source;
  return (transcript || "").trim();
}

export class BhashiniError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BhashiniError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------
// Bhashini expects raw WAV bytes (base64), not raw PCM float samples —
// this wraps the float32 PCM we already decoded upstream (in
// routes/speech.js) back into a minimal 16-bit PCM WAV container.
// ---------------------------------------------------------------------
function floatPcmToBase64Wav(float32Samples, sampleRate) {
  const numSamples = float32Samples.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // PCM fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  return buffer.toString("base64");
}