// FULL FILE: backend/src/services/ocrService.js
import { createWorker } from "tesseract.js";
import path from "path";
import fs from "fs";
const TESSDATA_PATH = path.join(process.cwd(), "tessdata");

// Below this Tesseract confidence, we treat the result as unreliable enough
// to be worth a second attempt via Gemini's vision model — Tesseract (a
// classical OCR engine) is print-optimized and degrades sharply on
// handwriting, which is common on Indian prescriptions and discharge
// summaries (spec 2.3: "OCR of handwritten and printed... documents").
// Gemini's multimodal model reads handwriting far more reliably.
const LOW_CONFIDENCE_THRESHOLD = 60;

/**
 * Runs real OCR on an image file using Tesseract.js.
 * langs: "eng" | "hin" | "eng+hin" etc.
 *
 * Tesseract.js can throw asynchronously in a way that bypasses a normal
 * try/catch (an uncaught 'error' event on the internal worker), which
 * previously crashed the whole Node process on malformed/unsupported
 * files (e.g. PDFs). We guard against that here by racing the recognize
 * call against a worker-level error listener so a bad file always
 * results in a rejected promise instead of taking the server down.
 *
 * If the result comes back low-confidence and GEMINI_API_KEY is set, we
 * retry with Gemini's vision model, which handles handwriting much
 * better than Tesseract. mimeType is needed for that fallback (Tesseract
 * itself doesn't need it — it reads bytes off disk directly).
 */
export async function runOcr(imagePath, langs = "eng", mimeType = "image/png") {
  const tesseractResult = await runTesseractOcr(imagePath, langs);

  if (tesseractResult.confidence >= LOW_CONFIDENCE_THRESHOLD || !process.env.GEMINI_API_KEY) {
    return tesseractResult;
  }

  try {
    const geminiResult = await runGeminiVisionOcr(imagePath, mimeType);
    // Only use the Gemini result if it actually found something — a blank
    // or failed Gemini call should fall back to whatever Tesseract got,
    // rather than losing the (weak) Tesseract text entirely.
    if (geminiResult?.text?.trim()) {
      return geminiResult;
    }
  } catch {
    // Swallow and fall back to the Tesseract result below — the vision
    // fallback is a best-effort improvement, not a hard dependency.
  }
  return tesseractResult;
}

async function runTesseractOcr(imagePath, langs) {
  const worker = await createWorker(langs, 1, {
    langPath: TESSDATA_PATH,
    gzip: true
  });
  try {
    const workerError = new Promise((_resolve, reject) => {
      worker.on?.("error", (err) => reject(err instanceof Error ? err : new Error(String(err))));
    });
    const { data } = await Promise.race([
      worker.recognize(imagePath),
      workerError
    ]);
    return {
      text: data.text,
      confidence: Math.round(data.confidence)
    };
  } catch (err) {
    throw new Error("Unable to read this file. Please upload a clear photo or scan (PNG/JPG).");
  } finally {
    await worker.terminate().catch(() => {});
  }
}

/**
 * Vision-based OCR fallback using Gemini's multimodal model — reads the
 * image directly (rather than a classical OCR pipeline), which handles
 * handwritten prescriptions/reports considerably better than Tesseract.
 * Gemini doesn't return a confidence score the way Tesseract does, so we
 * report a fixed, conservative confidence (75) marking it as a
 * vision-model read rather than a low-confidence classical OCR pass —
 * high enough that clinicalSafetyService's downstream checks still run,
 * but still low enough that fields land in "needs-verification" per the
 * >=85 threshold in extractionService.js, keeping a human in the loop.
 */
async function runGeminiVisionOcr(imagePath, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  const imageBytes = fs.readFileSync(imagePath);
  const base64Image = imageBytes.toString("base64");

  const prompt = `You are an OCR system reading a scanned Indian medical document (prescription, lab report, or discharge summary). It may be handwritten or printed, and may mix English and Hindi.

Transcribe ALL visible text exactly as written, preserving line breaks. Do not summarize, translate, or interpret — just transcribe. If a word is illegible, write [illegible] in its place rather than guessing.

Respond with ONLY the transcribed text, no preamble, no markdown, no commentary.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Image } }
        ]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini vision OCR request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return { text: text || "", confidence: 75, source: "gemini-vision" };
}