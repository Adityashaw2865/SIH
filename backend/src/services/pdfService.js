import { pdf } from "pdf-to-img";
import fs from "fs";

/**
 * Converts the first page of an uploaded PDF into a PNG image so it can be
 * fed into the existing Tesseract OCR pipeline (which only reads raster
 * images, not PDFs). Pure-JS (pdf-to-img / pdf.js under the hood) — no
 * system dependency like poppler or imagemagick, so it works unmodified
 * on a kiosk deployment.
 *
 * Returns the path to the generated PNG. The caller is responsible for
 * deleting both the original PDF and the generated PNG when done.
 */
export async function convertPdfToImage(pdfPath) {
  const outPath = `${pdfPath}.page1.png`;
  try {
    const document = await pdf(pdfPath, { scale: 2 });
    // Only the first page is used — multi-page prescriptions/reports are
    // rare in this OPD kiosk flow, and OCR-ing every page would slow the
    // patient-facing upload step considerably.
    const firstPage = await document.getPage(1);
    if (!firstPage) {
      throw new Error("PDF has no readable pages.");
    }
    fs.writeFileSync(outPath, firstPage);
    return outPath;
  } catch (err) {
    throw new Error("Unable to read this PDF. Please upload a clear photo or scan instead.");
  }
}

export function cleanupGeneratedImage(imagePath) {
  if (imagePath && fs.existsSync(imagePath)) {
    fs.unlink(imagePath, () => {});
  }
}
