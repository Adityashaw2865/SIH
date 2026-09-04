import { Router } from "express";
import multer from "multer";
import wavDecoder from "node-wav";
import { transcribeAudio } from "../services/speechService.js";

const upload = multer({ storage: multer.memoryStorage() });
export const speechRouter = Router();

/**
 * POST /api/speech/transcribe
 * multipart/form-data:
 *   - audio: a WAV file
 *   - language: MediKiosk language label, e.g. "Hindi" (optional)
 *
 * Returns: { success, data: { transcript } }
 */
speechRouter.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No audio file uploaded (expected field 'audio')." });
    }

    const { audio, sampleRate } = wavDecoder.decode(req.file.buffer);
    const mono = audio.length > 1
      ? audio[0].map((v, i) => (v + (audio[1]?.[i] ?? v)) / 2)
      : audio[0];

    const targetRate = 16000;
    const resampled = sampleRate === targetRate
      ? mono
      : resampleLinear(mono, sampleRate, targetRate);

    const transcript = await transcribeAudio(resampled, req.body.language);
    res.json({ success: true, data: { transcript } });
  } catch (err) {
    console.error("Speech transcription failed:", err);
    res.status(500).json({ success: false, error: "Transcription failed." });
  }
});

function resampleLinear(samples, fromRate, toRate) {
  const ratio = fromRate / toRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, samples.length - 1);
    const frac = srcIndex - i0;
    result[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
  }
  return result;
}