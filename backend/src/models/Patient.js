// backend/src/models/Patient.js
import mongoose, { Schema } from "mongoose";

// ---------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------

// A single "actor did X" entry — used everywhere (registration, consent
// changes, answers, document uploads, red-flag acknowledgement, doctor
// assignment, summary generation/edit/verify, HIS push, review toggles).
const AuditLogEntrySchema = new Schema({
  actor: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, default: undefined }
}, { timestamps: true });

// One question/answer recorded during the kiosk intake interview.
const AnswerSchema = new Schema({
  section: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: Schema.Types.Mixed, required: true },
  inputMode: { type: String, enum: ["tap", "voice", "type"], default: "tap" }
}, { timestamps: true });

// A red-flag alert raised by checkForRedFlag() in routes/patients.js.
const RedFlagSchema = new Schema({
  description: { type: String, required: true },
  acknowledged: { type: Boolean, default: false }
}, { timestamps: true });

// One structured field extracted (via OCR + Gemini/rules) from an
// uploaded document — see services/extractionService.js.
const DocumentFieldSchema = new Schema({
  label: {
    type: String,
    enum: ["Diagnosis", "Medication", "Dosage", "Frequency", "Doctor", "Date", "Test Name", "Result", "Reference Range"],
    required: true
  },
  value: { type: String, required: true },
  confidence: { type: Number, default: null },
  status: { type: String, enum: ["confirmed", "needs-verification", "edited"], default: "needs-verification" }
}, { timestamps: true });

// One uploaded document (prescription, lab report, discharge summary...)
// with its raw OCR text and extracted fields — see routes/documents.js.
const DocumentSchema = new Schema({
  category: { type: String, default: "Other" },
  originalFilename: { type: String, required: true },
  storedFilename: { type: String, required: true },
  mimeType: { type: String, required: true },
  ocrRawText: { type: String, default: "" },
  ocrConfidence: { type: Number, default: null },
  fields: { type: [DocumentFieldSchema], default: [] }
}, { timestamps: true });

// Patient-level consent flags — see routes/patients.js POST /:id/consent.
const ConsentsSchema = new Schema({
  historyCapture: { type: Boolean, default: false },
  documentProcessing: { type: Boolean, default: false },
  providerSharing: { type: Boolean, default: false }
}, { _id: false });

// A drug-interaction hit found by clinicalSafetyService.findDrugInteractions().
const DrugInteractionSchema = new Schema({
  drugA: { type: String, required: true },
  drugB: { type: String, required: true },
  severity: { type: String, enum: ["low", "moderate", "high"], required: true },
  note: { type: String, required: true }
}, { _id: false });

// An out-of-range lab result found by clinicalSafetyService.findAbnormalValues().
const AbnormalValueSchema = new Schema({
  testName: { type: String, required: true },
  result: { type: String, required: true },
  referenceRange: { type: String, required: true },
  flag: { type: String, enum: ["low", "high"], required: true }
}, { _id: false });

// The doctor-facing clinical summary — see routes/summary.js.
const SummarySchema = new Schema({
  chiefComplaint: { type: String, default: "Not recorded" },
  hpi: { type: String, default: "Not recorded" },
  pastMedicalHistory: { type: String, default: "Not recorded" },
  pastSurgicalHistory: { type: String, default: "Not recorded" },
  investigationFindings: { type: String, default: "Not recorded" },
  drugHistory: { type: String, default: "Not recorded" },
  allergies: { type: String, default: "Not recorded" },
  familyHistory: { type: String, default: "Not recorded" },
  personalHistory: { type: String, default: "Not recorded" },
  reviewOfSystems: { type: String, default: "Not recorded" },
  abnormalValues: { type: [AbnormalValueSchema], default: [] },
  drugInteractions: { type: [DrugInteractionSchema], default: [] },
  generatedAt: { type: Date, default: null },
  verifiedBy: { type: String, default: null },
  verifiedAt: { type: Date, default: null }
}, { _id: false });

// "Doctor has looked at this record" toggle — see POST /:id/mark-reviewed.
const ReviewedByDoctorSchema = new Schema({
  reviewed: { type: Boolean, default: false },
  reviewedBy: { type: String, default: null },
  reviewedAt: { type: Date, default: null }
}, { _id: false });

// Outcome of pushing this patient's FHIR bundle to the (simulated) HIS —
// see routes/summary.js POST /:patientId/push-to-his.
const HisPushSchema = new Schema({
  status: { type: String, enum: ["sent", "failed"], default: undefined },
  transactionId: { type: String, default: undefined },
  pushedAt: { type: Date, default: undefined },
  pushedBy: { type: String, default: undefined },
  errorMessage: { type: String, default: undefined }
}, { _id: false });

// ---------------------------------------------------------------------
// Main Patient schema
// ---------------------------------------------------------------------

const PatientSchema = new Schema({
  token: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, default: null },
  gender: { type: String, default: null },
  language: { type: String, default: "English" },
  department: { type: String, default: null },
  abha: { type: String, default: null },

  intakeStatus: { type: String, enum: ["in-progress", "complete"], default: "in-progress" },
  priority: { type: String, enum: ["normal", "critical"], default: "normal" },
  verificationStatus: { type: String, enum: ["pending", "verified"], default: "pending" },

  assignedDoctor: { type: String, default: null },

  answers: { type: [AnswerSchema], default: [] },
  redFlags: { type: [RedFlagSchema], default: [] },
  documents: { type: [DocumentSchema], default: [] },
  consents: { type: ConsentsSchema, default: () => ({}) },

  // Ayush assessment payload is patient-driven and free-form (see
  // POST /:id/ayush, which stores req.body as-is) — Mixed is intentional.
  ayush: { type: Schema.Types.Mixed, default: null },

  summary: { type: SummarySchema, default: null },
  reviewedByDoctor: { type: ReviewedByDoctorSchema, default: () => ({}) },
  hisPush: { type: HisPushSchema, default: null },

  auditLog: { type: [AuditLogEntrySchema], default: [] }
}, { timestamps: true });

export const Patient = mongoose.model("Patient", PatientSchema);