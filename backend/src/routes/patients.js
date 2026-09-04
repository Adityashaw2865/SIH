import { Router } from "express";
import { Patient } from "../models/Patient.js";
import { Staff } from "../models/Staff.js";
import { suggestDoctorForComplaint } from "../data/doctors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateOtp, verifyOtp, maskAbha } from "../services/abhaService.js";

export const patientsRouter = Router();

// Live doctor roster pulled from the Staff collection (role: "doctor"),
// replacing the old hardcoded list. Fetched once per request and passed
// into serializePatient so we don't re-query per-patient in list views.
async function fetchActiveDoctors() {
  const staffDoctors = await Staff.find({ role: "doctor" }).select("doctorName department username");
  return staffDoctors
    .filter(s => s.doctorName) // skip doctor accounts that haven't set a display name yet
    .map(s => ({ id: s._id.toString(), name: s.doctorName, department: s.department || "General Medicine" }));
}

function serializePatient(patient, doctors = []) {
  const obj = patient.toObject({ virtuals: false });
  obj.id = patient._id.toString();
  // Only surface a suggestion while triage hasn't assigned anyone yet —
  // once assigned, the admin's manual choice is the source of truth.
  if (!obj.assignedDoctor) {
    const complaint = obj.answers?.find(a => a.section === "Chief Complaint")?.answer;
    const suggested = suggestDoctorForComplaint(complaint, doctors);
    obj.suggestedDoctor = suggested ? { name: suggested.name, department: suggested.department } : null;
  } else {
    obj.suggestedDoctor = null;
  }
  return obj;
}

// Red-flag rules per chief complaint. Each rule matches a question (by
// keyword) + the answer that should trigger a priority alert, mirroring a
// physician's own mental checklist for that presenting complaint. Kept as
// a flat, editable table (spec 3.3 Module A — "Red-flag detection") rather
// than hardcoded per-complaint so new complaints/rules are easy to add.
const RED_FLAG_RULES = {
  "Chest pain": [
    { questionMatch: /breathless/i, answerEquals: "Yes", label: "breathlessness", note: "possible cardiac emergency" },
    { questionMatch: /sweating/i, answerEquals: "Yes", label: "sweating", note: "possible cardiac emergency" },
    { questionMatch: /dizzy|light-headed/i, answerEquals: "Yes", label: "dizziness/light-headedness", note: "possible cardiac emergency" },
    { questionMatch: /suddenly or gradually/i, answerEquals: "Suddenly", label: "sudden onset", note: "possible acute cardiac event" }
  ],
  "Fever": [
    { questionMatch: /neck stiffness|stiff neck/i, answerEquals: "Yes", label: "neck stiffness with fever", note: "possible meningitis — needs urgent assessment" },
    { questionMatch: /confusion|drowsy|difficult to wake/i, answerEquals: "Yes", label: "altered consciousness with fever", note: "possible severe sepsis/CNS infection" },
    { questionMatch: /rash/i, answerEquals: "Yes", label: "rash with fever", note: "possible meningococcemia/dengue — needs urgent assessment" },
    { questionMatch: /how high|temperature/i, answerEquals: "Above 103°F / 39.4°C", label: "very high fever", note: "possible severe infection" }
  ],
  "Stomach pain": [
    { questionMatch: /vomiting blood|black stool/i, answerEquals: "Yes", label: "GI bleeding signs", note: "possible internal bleeding — urgent assessment needed" },
    { questionMatch: /rigid|board-like|worse with movement/i, answerEquals: "Yes", label: "rigid/guarded abdomen", note: "possible surgical abdomen (e.g. appendicitis, perforation)" },
    { questionMatch: /fainted|lost consciousness/i, answerEquals: "Yes", label: "fainting with abdominal pain", note: "possible internal bleeding/shock" }
  ],
  "Headache": [
    { questionMatch: /sudden.*worst|worst headache/i, answerEquals: "Yes", label: "sudden severe (\"thunderclap\") headache", note: "possible subarachnoid haemorrhage — urgent assessment needed" },
    { questionMatch: /weakness|numbness|one side/i, answerEquals: "Yes", label: "one-sided weakness/numbness with headache", note: "possible stroke — urgent assessment needed" },
    { questionMatch: /slurred speech|trouble speaking/i, answerEquals: "Yes", label: "slurred speech with headache", note: "possible stroke — urgent assessment needed" },
    { questionMatch: /vision.*(loss|blurred|double)/i, answerEquals: "Yes", label: "vision changes with headache", note: "possible stroke or raised intracranial pressure" }
  ],
  "Breathlessness": [
    { questionMatch: /speak in full sentences/i, answerEquals: "No", label: "unable to speak in full sentences", note: "possible severe respiratory distress — urgent assessment needed" },
    { questionMatch: /blue or grey/i, answerEquals: "Yes", label: "cyanosis (blue/grey lips or fingertips)", note: "possible hypoxia — urgent assessment needed" },
    { questionMatch: /even while sitting still/i, answerEquals: "Yes", label: "breathlessness at rest", note: "possible severe cardiac or respiratory emergency" }
  ],
  "Weakness / one-sided body weakness": [
    { questionMatch: /one side of the body/i, answerEquals: "Yes", label: "one-sided body weakness", note: "possible stroke — urgent assessment needed (act FAST)" },
    { questionMatch: /drooping or numbness/i, answerEquals: "Yes", label: "facial drooping/numbness", note: "possible stroke — urgent assessment needed (act FAST)" },
    { questionMatch: /slurred speech|difficulty finding words/i, answerEquals: "Yes", label: "slurred speech", note: "possible stroke — urgent assessment needed (act FAST)" },
    { questionMatch: /sudden vision changes/i, answerEquals: "Yes", label: "sudden vision changes with weakness", note: "possible stroke — urgent assessment needed" }
  ],
  "Injury / bleeding": [
    { questionMatch: /heavy or ongoing bleeding/i, answerEquals: "Yes", label: "uncontrolled bleeding", note: "possible haemorrhagic emergency — urgent assessment needed" },
    { questionMatch: /lose consciousness/i, answerEquals: "Yes", label: "loss of consciousness after injury", note: "possible traumatic brain injury — urgent assessment needed" },
    { questionMatch: /obvious deformity/i, answerEquals: "Yes", label: "visible deformity/fracture", note: "possible fracture — needs prompt orthopaedic assessment" }
  ]
};

function checkForRedFlag(patient, section, question, answer) {
  const complaint = patient.answers.find(a => a.section === "Chief Complaint")?.answer;
  const rules = RED_FLAG_RULES[complaint];
  if (!rules) return null;
  for (const rule of rules) {
    if (rule.questionMatch.test(question) && answer === rule.answerEquals) {
      return `${complaint} with ${rule.label} — ${rule.note}.`;
    }
  }
  return null;
}

patientsRouter.post("/", async (req, res, next) => {
  try {
    const { name, age, gender, language, department, abha } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "name is required" } });
    }
    const patient = await Patient.create({
      token: `TKN-${Date.now().toString(36).toUpperCase()}`,
      name, age, gender,
      language: language || "English",
      department, abha,
      intakeStatus: "in-progress",
      auditLog: [{ actor: "patient", action: "registered", details: "Kiosk self-registration" }]
    });
    res.status(201).json({ success: true, data: serializePatient(patient) });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------
// ABHA-based existing-patient identification (simulated ABDM flow)
// ---------------------------------------------------------------------
// NOTE: This simulates the ABHA OTP login step — see services/abhaService.js
// for why, and how to swap it for a real ABDM gateway call later. These
// routes must stay ABOVE the GET "/:id" route below, or Express would try
// to treat "abha" as a patient id.

const ABHA_ID_REGEX = /^\d{14}$/;

patientsRouter.post("/abha/send-otp", async (req, res, next) => {
  try {
    const { abha } = req.body;
    if (!abha || !ABHA_ID_REGEX.test(abha)) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid 14-digit ABHA number." } });
    }
    const { otp, expiresInSeconds } = generateOtp(abha);
    res.json({
      success: true,
      data: {
        maskedTarget: maskAbha(abha),
        expiresInSeconds,
        // devOtp is only ever returned because there's no real SMS/ABDM
        // gateway configured yet — see abhaService.js. Remove this once
        // a real gateway is wired up (ABDM_GATEWAY_URL becomes set).
        devOtp: process.env.ABDM_GATEWAY_URL ? undefined : otp
      }
    });
  } catch (err) { next(err); }
});

patientsRouter.post("/abha/verify-otp", async (req, res, next) => {
  try {
    const { abha, otp } = req.body;
    if (!abha || !otp) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "abha and otp are required" } });
    }
    const ok = verifyOtp(abha, otp);
    if (!ok) {
      return res.status(401).json({ success: false, error: { code: "INVALID_OTP", message: "That code is incorrect or has expired. Please try again." } });
    }
    // OTP verified — look up this ABHA's most recent prior visit (if
    // any) so the frontend can prefill demographics for this new visit.
    const priorVisit = await Patient.findOne({ abha }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: {
        verified: true,
        existingPatient: priorVisit ? {
          name: priorVisit.name,
          age: priorVisit.age,
          gender: priorVisit.gender
        } : null
      }
    });
  } catch (err) { next(err); }
});

// Hospital-ID (visit token) lookup — for a patient who already has a
// token from a previous kiosk visit and wants to reuse those details
// instead of re-typing them. No OTP needed: the token was only ever
// handed out by this system in the first place.
patientsRouter.get("/lookup/hospital-id/:token", async (req, res, next) => {
  try {
    const token = (req.params.token || "").trim().toUpperCase();
    if (!token) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "token is required" } });
    }
    const patient = await Patient.findOne({ token });
    if (!patient) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No record found for that Hospital ID." } });
    }
    res.json({
      success: true,
      data: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        abha: patient.abha || undefined
      }
    });
  } catch (err) { next(err); }
});

patientsRouter.get("/doctors", async (_req, res, next) => {
  try {
    const doctors = await fetchActiveDoctors();
    res.json({ success: true, data: doctors });
  } catch (err) { next(err); }
});

// Staff-only: real hospital analytics computed from actual patient records
// (replaces hardcoded prototype numbers previously shown in AdminDashboard.jsx)
// FIX: added "admin" to the allowed roles — AdminDashboard.jsx calls this
// route but "admin" was previously missing, so it always 403'd for admins.
patientsRouter.get("/analytics", requireAuth, requireRole("triage", "doctor", "admin"), async (_req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Start of the 7-day window used for the "Cases Overview" trend chart
    // (today + 6 days back), so the admin dashboard can plot new vs
    // resolved (intake-complete) cases per day from real records.
    const startOfWindow = new Date(startOfToday);
    startOfWindow.setDate(startOfWindow.getDate() - 6);

    const [
      patientsToday,
      totalPatients,
      completedPatients,
      documentsAgg,
      priorityAlerts,
      verifiedCount,
      completeIntakeCount,
      languageAgg,
      totalDoctors,
      totalAdmins,
      newCasesByDay,
      resolvedCasesByDay,
      recentPatients
    ] = await Promise.all([
      Patient.countDocuments({ createdAt: { $gte: startOfToday } }),
      Patient.countDocuments(),
      Patient.countDocuments({ intakeStatus: "complete" }),
      Patient.aggregate([
        { $project: { docCount: { $size: { $ifNull: ["$documents", []] } } } },
        { $group: { _id: null, total: { $sum: "$docCount" } } }
      ]),
      Patient.countDocuments({ priority: "critical", "redFlags.acknowledged": false }),
      Patient.countDocuments({ verificationStatus: "verified" }),
      Patient.countDocuments({ intakeStatus: "complete" }),
      Patient.aggregate([
        { $group: { _id: "$language", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Staff.countDocuments({ role: "doctor" }),
      Staff.countDocuments({ role: "admin" }),
      // New cases per day = patients created that day.
      Patient.aggregate([
        { $match: { createdAt: { $gte: startOfWindow } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
      ]),
      // Resolved cases per day = intake marked "complete" that day, derived
      // from the audit log's intake_completed entry (there's no separate
      // "completedAt" field on Patient).
      Patient.aggregate([
        { $match: { intakeStatus: "complete" } },
        { $unwind: "$auditLog" },
        { $match: { "auditLog.action": "intake_completed", "auditLog.createdAt": { $gte: startOfWindow } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$auditLog.createdAt" } }, count: { $sum: 1 } } }
      ]),
      // Recent cases for the dashboard table — latest 5 registrations.
      Patient.find({}, { token: 1, name: 1, priority: 1, intakeStatus: 1, department: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const documentsProcessed = documentsAgg[0]?.total || 0;
    const completionRate = totalPatients ? Math.round((completedPatients / totalPatients) * 100) : 0;
    const verificationRate = completeIntakeCount ? Math.round((verifiedCount / completeIntakeCount) * 100) : 0;

    // Average intake time: time between patient creation and intakeStatus
    // becoming "complete", derived from the audit log (registered -> intake_completed).
    const completedWithLogs = await Patient.find(
      { intakeStatus: "complete" },
      { auditLog: 1 }
    ).limit(500);

    let avgIntakeMinutes = null;
    const durations = [];
    for (const p of completedWithLogs) {
      const start = p.auditLog.find(a => a.action === "registered")?.createdAt;
      const end = p.auditLog.find(a => a.action === "intake_completed")?.createdAt;
      if (start && end) {
        const minutes = (new Date(end) - new Date(start)) / 60000;
        if (minutes >= 0 && minutes < 120) durations.push(minutes);
      }
    }
    if (durations.length) {
      avgIntakeMinutes = Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10;
    }

    const totalLangCount = languageAgg.reduce((sum, l) => sum + l.count, 0);
    const languageDistribution = languageAgg.map(l => ({
      lang: l._id || "Unknown",
      pct: totalLangCount ? Math.round((l.count / totalLangCount) * 100) : 0
    }));

    // Build a dense 7-day series (missing days = 0) so the chart never has
    // gaps, in the same order as the map queries above.
    const newCasesMap = Object.fromEntries(newCasesByDay.map(d => [d._id, d.count]));
    const resolvedCasesMap = Object.fromEntries(resolvedCasesByDay.map(d => [d._id, d.count]));
    const casesOverview = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(startOfToday);
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      casesOverview.push({
        date: key,
        label: day.toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
        newCases: newCasesMap[key] || 0,
        resolvedCases: resolvedCasesMap[key] || 0
      });
    }

    const recentCases = recentPatients.map(p => ({
      id: p._id.toString(),
      token: p.token,
      name: p.name,
      department: p.department || "General Medicine",
      priority: p.priority,
      status: p.intakeStatus,
      createdAt: p.createdAt
    }));

    res.json({
      success: true,
      data: {
        patientsToday,
        totalPatients,
        totalDoctors,
        totalAdmins,
        avgIntakeMinutes, // null if not enough completed intakes yet to measure
        completionRate,
        documentsProcessed,
        priorityAlerts,
        verificationRate,
        languageDistribution,
        casesOverview,
        recentCases
      }
    });
  } catch (err) { next(err); }
});

// Staff-only: full patient list
patientsRouter.get("/", requireAuth, requireRole("triage", "doctor", "admin"), async (_req, res, next) => {
  try {
    const [patients, doctors] = await Promise.all([
      Patient.find().sort({ createdAt: -1 }),
      fetchActiveDoctors()
    ]);
    res.json({ success: true, data: patients.map(p => serializePatient(p, doctors)) });
  } catch (err) { next(err); }
});

patientsRouter.get("/:id", async (req, res, next) => {
  try {
    const [patient, doctors] = await Promise.all([Patient.findById(req.params.id), fetchActiveDoctors()]);
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    res.json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});

patientsRouter.get("/:id/review", async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    const chiefComplaint = patient.answers.find(a => a.section === "Chief Complaint")?.answer || null;
    const duration = patient.answers.find(a => a.section === "History of Present Illness")?.answer || null;
    res.json({
      success: true,
      data: {
        chiefComplaint,
        duration,
        documentsCount: patient.documents.length,
        ayushCompleted: !!patient.ayush
      }
    });
  } catch (err) { next(err); }
});

patientsRouter.post("/:id/consent", async (req, res, next) => {
  try {
    const { historyCapture, documentProcessing, providerSharing } = req.body;
    const existing = await Patient.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });

    // Build a precise audit entry describing exactly which consent(s)
    // changed and in which direction (granted/revoked), rather than a
    // generic "consent_recorded" note — this is what makes the consent
    // trail meaningful for DPDP-style review, and lets us distinguish
    // an initial grant from a later revocation.
    const before = existing.consents || {};
    const after = {
      historyCapture: !!historyCapture,
      documentProcessing: !!documentProcessing,
      providerSharing: !!providerSharing
    };
    const changes = Object.keys(after)
      .filter(key => !!before[key] !== after[key])
      .map(key => `${key}:${after[key] ? "granted" : "revoked"}`);

    const anyRevoked = Object.keys(after).some(key => !!before[key] && !after[key]);
    const action = changes.length === 0
      ? "consent_recorded"
      : (anyRevoked ? "consent_updated_with_revocation" : "consent_recorded");

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "consents.historyCapture": after.historyCapture,
          "consents.documentProcessing": after.documentProcessing,
          "consents.providerSharing": after.providerSharing
        },
        $push: {
          auditLog: {
            actor: "patient",
            action,
            details: changes.length ? changes.join(", ") : undefined
          }
        }
      },
      { new: true }
    );
    const doctors = await fetchActiveDoctors();
    res.json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});

patientsRouter.post("/:id/answers", async (req, res, next) => {
  try {
    const { section, question, answer, inputMode } = req.body;
    if (!section || !question || answer === undefined) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "section, question and answer are required" } });
    }
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    patient.answers.push({ section, question, answer, inputMode: inputMode || "tap" });

    const redFlagDescription = checkForRedFlag(patient, section, question, answer);
    if (redFlagDescription) {
      patient.redFlags.push({ description: redFlagDescription });
      patient.priority = "critical";
    }

    patient.auditLog.push({ actor: "patient", action: "answer_recorded", details: `${section}: ${question}` });
    await patient.save();
    const doctors = await fetchActiveDoctors();
    res.status(201).json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});

patientsRouter.post("/:id/ayush", async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: { ayush: req.body }, $push: { auditLog: { actor: "patient", action: "ayush_completed" } } },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    res.json({ success: true, data: patient.ayush });
  } catch (err) { next(err); }
});

patientsRouter.post("/:id/complete", async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: { intakeStatus: "complete" }, $push: { auditLog: { actor: "patient", action: "intake_completed" } } },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    const doctors = await fetchActiveDoctors();
    res.json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});

// Staff-only: acknowledge a red flag
patientsRouter.post("/:id/red-flags/:flagId/acknowledge", requireAuth, requireRole("triage", "doctor", "admin"), async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    const flag = patient.redFlags.id(req.params.flagId);
    if (!flag) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Red flag not found" } });
    flag.acknowledged = true;
    patient.auditLog.push({ actor: "triage", action: "red_flag_acknowledged", details: flag.description });
    await patient.save();
    const doctors = await fetchActiveDoctors();
    res.json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});

// Staff-only: assign doctor
patientsRouter.post("/:id/assign", requireAuth, requireRole("triage", "admin"), async (req, res, next) => {
  try {
    const { doctorName } = req.body;
    if (!doctorName) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "doctorName is required" } });
    }
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: { assignedDoctor: doctorName }, $push: { auditLog: { actor: "triage", action: "doctor_assigned", details: doctorName } } },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    const doctors = await fetchActiveDoctors();
    res.json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});

// Staff-only: verify summary
patientsRouter.post("/:id/verify", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const { verifiedBy } = req.body;
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          verificationStatus: "verified",
          "summary.verifiedBy": verifiedBy || "Unknown",
          "summary.verifiedAt": new Date()
        },
        $push: { auditLog: { actor: verifiedBy || "doctor", action: "summary_verified" } }
      },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    const doctors = await fetchActiveDoctors();
    res.json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});

// Doctor-only: mark/unmark "I have looked at this patient's record".
// Lightweight and independent of the summary verification flow above —
// a doctor can toggle this the moment they've reviewed the case, whether
// or not a clinical summary has even been generated yet.
patientsRouter.post("/:id/mark-reviewed", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const reviewed = req.body.reviewed !== false; // defaults to true if omitted
    const reviewerName = req.user?.doctorName || req.user?.username || "Unknown Doctor";
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "reviewedByDoctor.reviewed": reviewed,
          "reviewedByDoctor.reviewedBy": reviewed ? reviewerName : null,
          "reviewedByDoctor.reviewedAt": reviewed ? new Date() : null
        },
        $push: {
          auditLog: {
            actor: reviewerName,
            action: reviewed ? "marked_reviewed" : "marked_unreviewed"
          }
        }
      },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Patient not found" } });
    const doctors = await fetchActiveDoctors();
    res.json({ success: true, data: serializePatient(patient, doctors) });
  } catch (err) { next(err); }
});