import { createWorker } from "tesseract.js";
import path from "path";
const TESSDATA_PATH = path.join(process.cwd(), "tessdata");

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
 */
export async function runOcr(imagePath, langs = "eng") {
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
