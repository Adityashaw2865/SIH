import { Router } from "express";
import { Patient } from "../models/Patient.js";
import { buildFhirPatient, buildFhirCondition, buildFhirMedicationStatement, buildFhirBundle } from "../services/fhirService.js";
import { structureNarrative } from "../services/extractionService.js";
import { findAbnormalValues, findDrugInteractions } from "../services/clinicalSafetyService.js";
import { pushBundleToHis } from "../services/hisPushService.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
export const summaryRouter = Router();

// Shared by GET /:patientId/fhir (preview/export) and POST /:patientId/push-to-his
// (actually "send" it) — both need the exact same bundle, so build it once here.
function buildBundleForPatient(patient) {
  const resources = [buildFhirPatient({
    id: patient._id.toString(),
    name: patient.name,
    age: patient.age || 0,
    gender: patient.gender || "Other",
    abha: patient.abha || undefined
  })];
  if (patient.summary?.chiefComplaint && patient.summary.chiefComplaint !== "Not recorded") {
    resources.push(buildFhirCondition({
      patientId: patient._id.toString(),
      text: patient.summary.chiefComplaint
    }));
  }
  if (patient.summary?.drugHistory && patient.summary.drugHistory !== "Not recorded") {
    resources.push(buildFhirMedicationStatement({
      patientId: patient._id.toString(),
      medicationText: patient.summary.drugHistory
    }));
  }
  return buildFhirBundle(resources);
}

function fieldsFromDocuments(patient, labels) {
  const parts = [];
  for (const doc of patient.documents || []) {
    for (const field of doc.fields || []) {
      if (!labels.includes(field.label)) continue;
      if (field.status === "needs-verification") continue;
      const when = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN") : null;
      parts.push(`${field.value} (from ${doc.category}${when ? `, ${when}` : ""})`);
    }
  }
  return parts.join("; ");
}

function combine(fromAnswers, fromDocs) {
  const pieces = [];
  if (fromAnswers && fromAnswers !== "Not recorded") pieces.push(fromAnswers);
  if (fromDocs) pieces.push(`From uploaded documents: ${fromDocs}`);
  return pieces.length ? pieces.join(" | ") : "Not recorded";
}

// Generating/editing a clinical summary is a doctor action (matches the
// doctor-only /verify route in patients.js) — triage staff shouldn't be
// able to change clinical content.
summaryRouter.post("/:patientId/generate", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Patient not found"
      }
    });
    const bySection = section => patient.answers.filter(a => a.section === section).map(a => `${a.question} → ${a.answer}`).join("; ") || "Not recorded";
    const chiefComplaint = patient.answers.find(a => a.section === "Chief Complaint")?.answer || "Not recorded";

    const diagnosesFromDocs = fieldsFromDocuments(patient, ["Diagnosis"]);
    const medicationsFromDocs = fieldsFromDocuments(patient, ["Medication", "Dosage", "Frequency"]);
    const investigationsFromDocs = fieldsFromDocuments(patient, ["Test Name", "Result", "Reference Range"]);

    const rawHpi = bySection("History of Present Illness");
    const hpi = await structureNarrative(chiefComplaint, rawHpi);

    // --- Clinical safety checks (spec 3.3 Module B) ---------------------
    const abnormalValues = (patient.documents || []).flatMap(doc => findAbnormalValues(doc.fields || []));

    const medsFromDocs = (patient.documents || [])
      .flatMap(doc => (doc.fields || []).filter(f => f.label === "Medication").map(f => f.value));
    const medsFromAnswers = patient.answers
      .filter(a => a.section === "Medication")
      .map(a => a.answer);
    const drugInteractions = findDrugInteractions([...medsFromDocs, ...medsFromAnswers]);

    patient.summary = {
      chiefComplaint,
      hpi,
      pastMedicalHistory: combine(bySection("Past History"), diagnosesFromDocs),
      pastSurgicalHistory: bySection("Past Surgical History"),
      investigationFindings: investigationsFromDocs ? `From uploaded documents: ${investigationsFromDocs}` : "Not recorded",
      drugHistory: combine(bySection("Medication"), medicationsFromDocs),
      allergies: bySection("Allergies"),
      familyHistory: bySection("Family History"),
      personalHistory: bySection("Personal History"),
      reviewOfSystems: bySection("Review of Systems"),
      abnormalValues,
      drugInteractions,
      generatedAt: new Date(),
      // Don't carry forward a stale verification — new/regenerated
      // content has not been reviewed by a doctor yet.
      verifiedBy: undefined,
      verifiedAt: undefined
    };
    // A freshly (re)generated summary is unreviewed — reset the
    // patient-level verification flag so the "✓ Verified" badge doesn't
    // keep showing on content nobody has actually confirmed yet.
    patient.verificationStatus = "pending";
    await patient.save();
    res.json({
      success: true,
      data: patient.summary
    });
  } catch (err) {
    next(err);
  }
});

summaryRouter.patch("/:patientId", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const allowed = ["chiefComplaint", "hpi", "pastMedicalHistory", "pastSurgicalHistory", "investigationFindings", "drugHistory", "allergies", "familyHistory", "personalHistory", "reviewOfSystems"];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "No valid fields to update"
      }
    });
    const setObj = {};
    for (const [k, v] of updates) setObj[`summary.${k}`] = v;
    // An edit to an already-verified summary invalidates that
    // verification — reset both the summary-level and patient-level flags
    // so the doctor has to re-confirm the edited content.
    setObj["summary.verifiedBy"] = null;
    setObj["summary.verifiedAt"] = null;
    setObj["verificationStatus"] = "pending";

    // FIXED BUG: previously this fell back to a hardcoded fake name
    // ("Dr. Sharma") when editedBy wasn't sent, corrupting the audit
    // trail. Now it falls back to the authenticated doctor's real identity.
    const editorName = req.body.editedBy || req.user?.doctorName || req.user?.username || "Unknown Doctor";

    const patient = await Patient.findByIdAndUpdate(req.params.patientId, {
      $set: setObj,
      $push: {
        auditLog: {
          actor: editorName,
          action: "summary_edited",
          details: JSON.stringify(updates.map(([k]) => k))
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
    res.json({
      success: true,
      data: patient.summary
    });
  } catch (err) {
    next(err);
  }
});

// FHIR export — read-only, so both triage and doctor can pull it.
summaryRouter.get("/:patientId/fhir", requireAuth, requireRole("triage", "doctor"), async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Patient not found"
      }
    });
    res.json({
      success: true,
      data: buildBundleForPatient(patient)
    });
  } catch (err) {
    next(err);
  }
});

// Simulated push to a hospital HIS / the ABDM ecosystem — see
// services/hisPushService.js for why this is a mock, not a real gateway
// call. Doctor or triage can trigger it (matches who can pull /fhir);
// records the outcome on the patient record + audit log either way, so a
// failed push is visible in the Timeline tab too, not just swallowed.
summaryRouter.post("/:patientId/push-to-his", requireAuth, requireRole("triage", "doctor"), async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Patient not found" }
    });

    const bundle = buildBundleForPatient(patient);
    // `simulateFailure` is only ever sent by the demo/test UI to show what
    // a rejected push looks like — never something a real HIS would ask for.
    const result = await pushBundleToHis(bundle, { simulateFailure: !!req.body.simulateFailure });

    if (result.ok) {
      patient.hisPush = {
        status: "sent",
        transactionId: result.transactionId,
        pushedAt: new Date(),
        pushedBy: req.body.pushedBy || req.user?.username || "unknown",
        errorMessage: undefined
      };
      patient.auditLog.push({
        actor: req.body.pushedBy || req.user?.username || "staff",
        action: "pushed_to_his",
        details: `Transaction ${result.transactionId}`
      });
    } else {
      patient.hisPush = {
        status: "failed",
        transactionId: undefined,
        pushedAt: new Date(),
        pushedBy: req.body.pushedBy || req.user?.username || "unknown",
        errorMessage: result.errorMessage
      };
      patient.auditLog.push({
        actor: req.body.pushedBy || req.user?.username || "staff",
        action: "his_push_failed",
        details: result.errorMessage
      });
    }
    await patient.save();

    if (!result.ok) {
      return res.status(502).json({
        success: false,
        error: { code: "HIS_PUSH_FAILED", message: result.errorMessage },
        data: { hisPush: patient.hisPush }
      });
    }
    res.json({ success: true, data: { hisPush: patient.hisPush } });
  } catch (err) {
    next(err);
  }
});