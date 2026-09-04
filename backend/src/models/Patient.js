import mongoose, { Schema } from "mongoose";
const AnswerSchema = new Schema({
  section: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  inputMode: {
    type: String,
    enum: ["tap", "voice"],
    default: "tap"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});
const RedFlagSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});
const ExtractedFieldSchema = new Schema({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ["confirmed", "needs-verification", "edited"],
    default: "needs-verification"
  }
}, {
  _id: true
});
const DocumentSchema = new Schema({
  category: {
    type: String,
    enum: ["Prescription", "Lab Report", "Discharge Summary", "Imaging Report", "Surgery Record", "Other"],
    default: "Other"
  },
  originalFilename: String,
  // Server-side filename (multer's generated name in data/uploads) so the
  // original file can be served back for viewing. NOTE: on Render's free/
  // starter tier this disk is ephemeral — files won't survive a redeploy.
  // For permanent storage, move this to Cloudinary/S3 instead.
  storedFilename: String,
  mimeType: String,
  ocrRawText: String,
  ocrConfidence: Number,
  fields: [ExtractedFieldSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});
const ClinicalSummarySchema = new Schema({
  chiefComplaint: String,
  hpi: String,
  pastMedicalHistory: String,
  pastSurgicalHistory: String,
  // Lab/vital results pulled from uploaded documents (Test Name/Result/
  // Reference Range fields) — kept separate from pastSurgicalHistory,
  // which they were previously (incorrectly) merged into.
  investigationFindings: String,
  drugHistory: String,
  allergies: String,
  familyHistory: String,
  personalHistory: String,
  reviewOfSystems: String,
  // Clinical safety check outputs (spec 3.3 Module B) — MUST be declared
  // here, otherwise Mongoose silently strips them on save/assign since
  // they aren't part of the schema, and the doctor dashboard never
  // receives abnormal-value / drug-interaction warnings.
  abnormalValues: { type: [Schema.Types.Mixed], default: [] },
  drugInteractions: { type: [Schema.Types.Mixed], default: [] },
  generatedAt: Date,
  verifiedBy: String,
  verifiedAt: Date
}, {
  _id: false
});
const AyushProfileSchema = new Schema({
  prakriti: String,
  vikriti: String,
  sara: String,
  samhanana: String,
  pramana: String,
  satmya: String,
  sattva: String,
  aharaShakti: String,
  vyayamaShakti: String,
  vaya: String,
  ahara: String,
  vihara: String,
  agni: String,
  koshtha: String,
  nidana: String,
  samprapti: String
}, {
  _id: false
});
const AuditEntrySchema = new Schema({
  actor: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});
// Tracks the (simulated) push of this patient's FHIR bundle to a hospital
// HIS / the ABDM ecosystem. See services/hisPushService.js — there is no
// real HIS/ABDM gateway configured for this deployment, so "sent" here
// means the mock gateway accepted the bundle, not that a real hospital
// system received it. Swapping in a real gateway later only touches
// hisPushService.js.
const HisPushSchema = new Schema({
  status: {
    type: String,
    enum: ["not-sent", "sent", "failed"],
    default: "not-sent"
  },
  transactionId: String,
  pushedAt: Date,
  pushedBy: String,
  errorMessage: String
}, {
  _id: false
});
const PatientSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  age: Number,
  gender: {
    type: String,
    enum: ["M", "F", "Other"]
  },
  language: {
    type: String,
    default: "English"
  },
  department: String,
  // NOT unique: this collection stores one document PER VISIT, so the
  // same ABHA number legitimately appears on multiple documents (one per
  // hospital visit). Indexed (non-unique) so the ABHA login flow —
  // "find this patient's most recent prior visit by ABHA ID" — is fast.
  // See routes/patients.js: POST /abha/verify-otp.
  abha: {
    type: String,
    index: true
  },
  // Manually assigned by triage staff (no doctor login/auth system yet —
  // see backend/src/data/doctors.js for the fixed roster this is drawn from).
  assignedDoctor: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    enum: ["critical", "high", "review", "routine"],
    default: "routine"
  },
  intakeStatus: {
    type: String,
    enum: ["not-started", "in-progress", "complete"],
    default: "not-started"
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified"],
    default: "pending"
  },
  // Lightweight "a doctor has opened and looked at this record" marker —
  // deliberately separate from verificationStatus above (which tracks
  // whether the *clinical summary content* has been verified). A doctor
  // can mark a patient reviewed the moment they've looked the case over,
  // well before a summary even exists.
  reviewedByDoctor: {
    reviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  consents: {
    historyCapture: {
      type: Boolean,
      default: false
    },
    documentProcessing: {
      type: Boolean,
      default: false
    },
    providerSharing: {
      type: Boolean,
      default: false
    }
  },
  answers: [AnswerSchema],
  redFlags: [RedFlagSchema],
  documents: [DocumentSchema],
  summary: ClinicalSummarySchema,
  ayush: AyushProfileSchema,
  hisPush: {
    type: HisPushSchema,
    default: () => ({ status: "not-sent" })
  },
  auditLog: [AuditEntrySchema]
}, {
  timestamps: true
});
export const Patient = mongoose.model("Patient", PatientSchema);