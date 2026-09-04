import { Router } from "express";
import multer from "multer";
import wavDecoder from "node-wav";
import { transcribeAudio } from "../services/speechService.js";

// FIXED BUG: no fileSize limit was set before — memoryStorage() buffers
// the whole upload in RAM, so an unbounded audio file could exhaust
// server memory (DoS). Capped at 15MB, matching the pattern in documents.js.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});
export const speechRouter = Router();

// Wrap multer so its errors (e.g. file too large) return the same
// { code, message } error shape used everywhere else in the app.
function uploadSingleAudio(req, res, next) {
  upload.single("audio")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: { code: "UPLOAD_ERROR", message: err.message || "Unable to upload this audio file." }
      });
    }
    next();
  });
}

/**
 * POST /api/speech/transcribe
 * multipart/form-data:
 *   - audio: a WAV file
 *   - language: MediKiosk language label, e.g. "Hindi" (optional)
 *
 * Returns: { success, data: { transcript } }
 */
speechRouter.post("/transcribe", uploadSingleAudio, async (req, res) => {
  try {
    if (!req.file) {
      // FIXED BUG: error used to be a bare string; now matches the
      // { code, message } shape used across the rest of the API.
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "No audio file uploaded (expected field 'audio')." }
      });
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
    // FIXED BUG: same { code, message } shape here too, for consistency.
    res.status(500).json({
      success: false,
      error: { code: "TRANSCRIPTION_FAILED", message: "Transcription failed." }
    });
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