import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Patient } from "../models/Patient.js";
import { runOcr } from "../services/ocrService.js";
import { extractClinicalEntities } from "../services/extractionService.js";
import { convertPdfToImage, cleanupGeneratedImage } from "../services/pdfService.js";
import { requireAuth } from "../middleware/auth.js";
export const documentsRouter = Router();
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
fs.mkdirSync(UPLOAD_DIR, {
  recursive: true
});
const upload = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  // 10MB max
  fileFilter: (_req, file, cb) => {
    // Tesseract.js (via Leptonica) cannot read PDF files directly — only
    // rasterized images. PDFs are converted to a PNG (first page) via
    // pdf-to-img before OCR — see convertPdfToImage() below.
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Unsupported file type. Please upload a PNG, JPG, WEBP image, or a PDF."));
    cb(null, true);
  }
});

// Wrap multer so its fileFilter/size-limit errors return a proper
// JSON message instead of falling through to the generic 500 handler.
function uploadSingleFile(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: "UPLOAD_ERROR",
          message: err.message || "Unable to upload this file."
        }
      });
    }
    next();
  });
}

// Upload a document, run REAL OCR + extraction pipeline, embed result in the patient document
documentsRouter.post("/:patientId/upload", uploadSingleFile, async (req, res, next) => {
  const file = req.file;
  if (!file) return res.status(400).json({
    success: false,
    error: {
      code: "NO_FILE",
      message: "No file uploaded"
    }
  });
  let generatedImagePath = null;
  try {
    const {
      category,
      langs
    } = req.body;
    // PDFs can't be OCR'd directly — rasterize the first page to a PNG first.
    const ocrInputPath = file.mimetype === "application/pdf" ? (generatedImagePath = await convertPdfToImage(file.path)) : file.path;
    const {
      text,
      confidence
    } = await runOcr(ocrInputPath, langs || "eng");
    const fields = await extractClinicalEntities(text, confidence);
    const patient = await Patient.findByIdAndUpdate(req.params.patientId, {
      $push: {
        documents: {
          category: category || "Other",
          originalFilename: file.originalname,
          storedFilename: file.filename,
          mimeType: file.mimetype,
          ocrRawText: text,
          ocrConfidence: confidence,
          fields
        },
        auditLog: {
          actor: "system",
          action: "document_uploaded",
          details: `${category || "Other"} (${file.originalname}) — OCR confidence ${confidence}%`
        }
      }
    }, {
      new: true
    });
    if (!patient) return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Patient not found"
      }
    });
    const savedDoc = patient.documents[patient.documents.length - 1];
    res.status(201).json({
      success: true,
      data: savedDoc
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: "OCR_PROCESSING_FAILED",
        message: "Unable to process the document."
      }
    });
  } finally {
    // Note: the original uploaded file (file.path) is deliberately kept on
    // disk now — see storedFilename above — so /view can serve it back.
    // Only the temporary PDF-to-image conversion is cleaned up.
    cleanupGeneratedImage(generatedImagePath);
  }
});

// Serve back the original uploaded file so staff can view it (view/download).
// Staff-only, matching the auth pattern used for /api/summary.
documentsRouter.get("/:patientId/:documentId/view", requireAuth, async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Patient not found" }
    });
    const doc = patient.documents.id(req.params.documentId);
    if (!doc || !doc.storedFilename) return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "File not found — it may have been cleared by a redeploy." }
    });
    const filePath = path.join(UPLOAD_DIR, doc.storedFilename);
    if (!fs.existsSync(filePath)) return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "File not found — it may have been cleared by a redeploy." }
    });
    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${doc.originalFilename}"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// Confirm / edit an extracted field
// NOTE: deliberately public (no requireAuth) — this is called from the
// patient-facing kiosk flow (DocumentReview.jsx), where the patient has
// no login/JWT at all. Matches the same public pattern used for the rest
// of the patient intake routes in routes/patients.js.
documentsRouter.patch("/:patientId/:documentId/fields/:fieldId", async (req, res, next) => {
  try {
    const {
      value,
      status
    } = req.body;
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Patient not found"
      }
    });
    const doc = patient.documents.id(req.params.documentId);
    if (!doc) return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Document not found"
      }
    });
    const field = doc.fields.id(req.params.fieldId);
    if (!field) return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Field not found"
      }
    });
    if (value !== undefined) field.value = value;
    field.status = status || "edited";
    await patient.save();
    res.json({
      success: true,
      data: field
    });
  } catch (err) {
    next(err);
  }
});