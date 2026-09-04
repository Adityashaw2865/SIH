import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, X, Edit3, FileText, Leaf, ShieldCheck, AlertTriangle, Pill, Users2 } from "lucide-react";
import { StaffShell } from "../../components/Shells";
import { Card, Badge, Button, ConfidenceBadge, PriorityBadge, EmptyState } from "../../components/ui";
import api from "../../services/api";
const tabs = ["Overview", "History", "Timeline", "Documents", "AYUSH", "Verification"];
export default function DoctorPatientDetail() {
  const {
    id
  } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");

  // FIX: use the actually logged-in doctor (from the JWT payload Login.jsx
  // stored) instead of hardcoding "Dr. Sharma" everywhere below.
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentDoctorName = currentUser?.doctorName || currentUser?.username || "Unknown Doctor";

  const loadPatient = () => {
    api.get(`/api/patients/${id}`).then(res => setPatient(res.data.data)).catch(() => setPatient(null)).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPatient();
  }, [id]);

  const generateSummary = () => {
    api.post(`/api/summary/${id}/generate`).then(loadPatient).catch(() => {});
  };

  const toggleReviewed = () => {
    const nextReviewed = !patient.reviewedByDoctor?.reviewed;
    api.post(`/api/patients/${id}/mark-reviewed`, { reviewed: nextReviewed }).then(loadPatient).catch(() => {});
  };

  if (loading) {
    return <StaffShell role="doctor" title="Loading…">
        <EmptyState icon={<Users2 size={22} />} title="Loading patient record…" message="" />
      </StaffShell>;
  }
  if (!patient) {
    return <StaffShell role="doctor" title="Patient not found">
        <EmptyState icon={<Users2 size={22} />} title="No patient found" message="This patient record could not be located." />
      </StaffShell>;
  }
  return <StaffShell role="doctor" title={patient.name}>
      <Card className="p-5 mb-6 flex flex-wrap items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center font-bold text-lg">
            {patient.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="font-bold text-ink text-lg">{patient.name}</p>
            <p className="text-sm text-ink-soft">
              {patient.age} yrs · {patient.gender} · ABHA {patient.abha || "Not linked"} · {patient.department || "General"} · {patient.language}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={patient.priority} />
          <Badge tone={patient.intakeStatus === "complete" ? "success" : "warn"}>
            {patient.intakeStatus === "complete" ? "🟢 Ready for consultation" : "In progress"}
          </Badge>
          {patient.reviewedByDoctor?.reviewed ? (
            <Badge tone="success">
              ✓ Reviewed by {patient.reviewedByDoctor.reviewedBy}
            </Badge>
          ) : null}
          <Button
            variant={patient.reviewedByDoctor?.reviewed ? "secondary" : "primary"}
            size="sm"
            onClick={toggleReviewed}
          >
            <Check size={16} />
            {patient.reviewedByDoctor?.reviewed ? "Unmark reviewed" : "Mark as reviewed"}
          </Button>
        </div>
      </Card>

      {patient.redFlags?.length > 0 && <Card className="p-4 mb-6 border-emergency/40 bg-red-50/40 flex items-start gap-3">
          <AlertTriangle className="text-emergency shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-emergency">Priority alert active</p>
            <p className="text-sm text-ink mt-0.5">{patient.redFlags.map(f => f.description).join(" · ")}</p>
          </div>
        </Card>}

      <div className="flex gap-1 border-b border-teal-light mb-6 overflow-x-auto">
        {tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${tab === t ? "border-teal text-teal" : "border-transparent text-ink-soft hover:text-ink"}`}>
            {t}
          </button>)}
      </div>

      {tab === "Overview" && <OverviewTab patient={patient} onGenerateSummary={generateSummary} />}
      {tab === "History" && <HistoryTab patient={patient} patientId={id} onSaved={loadPatient} currentDoctorName={currentDoctorName} />}
      {tab === "Timeline" && <TimelineTab patient={patient} />}
      {tab === "Documents" && <DocumentsTab patient={patient} />}
      {tab === "AYUSH" && <AyushTab patient={patient} />}
      {tab === "Verification" && <VerificationTab patient={patient} patientId={id} onVerified={loadPatient} currentDoctorName={currentDoctorName} />}
    </StaffShell>;
}
function OverviewTab({
  patient,
  onGenerateSummary
}) {
  const s = patient.summary || {};
  return <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-ink-soft uppercase mb-2">Chief Complaint</p>
            <p className="text-ink font-medium">{s.chiefComplaint || "Not generated yet"}</p>
          </div>
          <Button size="sm" onClick={onGenerateSummary}>Generate Summary</Button>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold text-ink-soft uppercase mb-2">Key HPI</p>
          <p className="text-ink">{s.hpi || "Not recorded"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold text-ink-soft uppercase mb-2">Current Medications</p>
          <p className="text-ink">{s.drugHistory || "Not recorded"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold text-ink-soft uppercase mb-2">Allergies</p>
          <p className="text-ink">{s.allergies || "Not recorded"}</p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-xs font-bold text-ink-soft uppercase mb-2">Relevant Past History</p>
          <p className="text-sm text-ink">{s.pastMedicalHistory || "Not recorded"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold text-ink-soft uppercase mb-2">AI Flags</p>
          {patient.redFlags?.length ? <ul className="text-sm text-emergency font-medium space-y-1">
              {patient.redFlags.map(r => <li key={r._id}>⚠ {r.description}</li>)}
            </ul> : <p className="text-sm text-ink-soft">No red flags detected.</p>}
        </Card>
        <SafetyWarningsCard summary={s} />
      </div>
    </div>;
}

function SafetyWarningsCard({ summary }) {
  const abnormalValues = summary.abnormalValues || [];
  const drugInteractions = summary.drugInteractions || [];
  const hasWarnings = abnormalValues.length > 0 || drugInteractions.length > 0;

  return <Card className={`p-5 ${hasWarnings ? "border-emergency/40 bg-red-50/30" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Pill size={16} className={hasWarnings ? "text-emergency" : "text-ink-soft"} />
        <p className="text-xs font-bold text-ink-soft uppercase">Safety Checks</p>
      </div>

      {!hasWarnings && <p className="text-sm text-ink-soft">No abnormal values or known drug interactions detected.</p>}

      {abnormalValues.length > 0 && <div className="mb-3">
          <p className="text-xs font-semibold text-emergency mb-1.5">Abnormal Lab Values</p>
          <ul className="space-y-1">
            {abnormalValues.map((v, i) => <li key={i} className="text-sm text-ink">
                <span className="font-semibold">{v.testName}</span>: {v.result}{" "}
                <span className="text-emergency font-semibold">
                  ({v.flag === "high" ? "↑ above" : "↓ below"} range {v.referenceRange})
                </span>
              </li>)}
          </ul>
        </div>}

      {drugInteractions.length > 0 && <div>
          <p className="text-xs font-semibold text-emergency mb-1.5">Possible Drug Interactions</p>
          <ul className="space-y-1.5">
            {drugInteractions.map((d, i) => <li key={i} className="text-sm text-ink">
                <span className="font-semibold">{d.drugA}</span> + <span className="font-semibold">{d.drugB}</span>{" "}
                <Badge tone={d.severity === "high" ? "emergency" : "warn"} className="ml-1">{d.severity}</Badge>
                <p className="text-xs text-ink-soft mt-0.5">{d.note}</p>
              </li>)}
          </ul>
        </div>}
    </Card>;
}
function HistoryTab({
  patient,
  patientId,
  onSaved,
  currentDoctorName
}) {
  const [editingField, setEditingField] = useState(null);
  const [draft, setDraft] = useState("");
  const s = patient.summary || {};
  const rows = [["chiefComplaint", "Chief Complaint", s.chiefComplaint], ["hpi", "History of Present Illness", s.hpi], ["pastMedicalHistory", "Past Medical History", s.pastMedicalHistory], ["pastSurgicalHistory", "Past Surgical History", s.pastSurgicalHistory], ["investigationFindings", "Investigation Findings", s.investigationFindings], ["familyHistory", "Family History", s.familyHistory], ["personalHistory", "Personal History", s.personalHistory], ["reviewOfSystems", "Review of Systems", s.reviewOfSystems]];
  const save = key => {
    // FIX: attribute the edit to the real logged-in doctor, not a hardcoded name
    api.patch(`/api/summary/${patientId}`, {
      [key]: draft,
      editedBy: currentDoctorName
    }).then(onSaved).catch(() => {});
    setEditingField(null);
  };
  return <div className="space-y-4">
      {rows.map(([key, label, value]) => <Card key={key} className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-ink-soft uppercase">{label}</p>
            <button onClick={() => {
          if (editingField === key) {
            save(key);
          } else {
            setDraft(value || "");
            setEditingField(key);
          }
        }} className="text-xs font-semibold text-teal flex items-center gap-1 hover:underline">
              <Edit3 size={12} /> {editingField === key ? "Save" : "Edit"}
            </button>
          </div>
          {editingField === key ? <textarea value={draft} onChange={e => setDraft(e.target.value)} className="w-full border border-teal-light rounded-xl p-3 text-sm text-ink min-h-[90px] focus:border-teal outline-none" /> : <p className="text-ink">{value || "Not recorded"}</p>}
        </Card>)}
    </div>;
}
function TimelineTab({
  patient
}) {
  const events = patient.auditLog || [];
  if (!events.length) {
    return <EmptyState icon={<FileText size={22} />} title="No historical records available." message="No previous medical documents or timeline events have been added yet." />;
  }
  return <Card className="p-6">
      <div className="relative pl-6 border-l-2 border-teal-light space-y-8">
        {events.map(ev => <div key={ev._id} className="relative">
            <span className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-teal border-2 border-white" />
            <p className="text-xs font-semibold text-ink-soft mb-1">{new Date(ev.createdAt).toLocaleString()}</p>
            <p className="font-bold text-ink">{ev.action.replace(/_/g, " ")}</p>
            {ev.details && <p className="text-sm text-ink-soft mt-1">{ev.details}</p>}
          </div>)}
      </div>
    </Card>;
}
// Picks the best available date for a document: prefers the OCR-extracted
// "Date" field (the document's own date — e.g. a prescription date), and
// falls back to the upload timestamp when no date could be extracted.
// This is what lets documents be ordered into a true medical timeline
// (spec 3.3 Module B — "Chronological organization") rather than just
// upload order.
function resolveDocumentDate(doc) {
  const extractedDate = doc.fields?.find(f => f.label === "Date")?.value;
  if (extractedDate) {
    const parsed = new Date(extractedDate);
    if (!isNaN(parsed.getTime())) return { date: parsed, isExtracted: true };
  }
  return { date: new Date(doc.createdAt), isExtracted: false };
}

const CATEGORY_ICON_TONE = {
  "Prescription": "teal",
  "Lab Report": "warn",
  "Discharge Summary": "success",
  "Imaging Report": "ayur",
  "Surgery Record": "danger",
  "Other": "slate"
};

function DocumentsTab({
  patient
}) {
  if (!patient.documents?.length) {
    return <EmptyState icon={<FileText size={22} />} title="No previous documents uploaded." message="This patient hasn't uploaded any prescriptions, lab reports, or other records." />;
  }
  async function viewDocument(doc) {
    try {
      const res = await api.get(`/api/documents/${patient._id}/${doc._id}/view`, {
        responseType: "blob"
      });
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank");
    } catch {
      alert("Couldn't open this file — it may have been cleared by a server redeploy.");
    }
  }

  // Order documents chronologically (oldest first) using the resolved
  // document date, so the physician can read the patient's medical
  // history as a single coherent story rather than upload order.
  const orderedDocs = [...patient.documents]
    .map(doc => ({ doc, ...resolveDocumentDate(doc) }))
    .sort((a, b) => a.date - b.date);

  return <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-bold text-ink-soft uppercase mb-5">Chronological Document Timeline</p>
        <div className="relative pl-6 border-l-2 border-teal-light space-y-8">
          {orderedDocs.map(({ doc, date, isExtracted }) => <div key={doc._id} className="relative">
              <span className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-teal border-2 border-white" />
              <p className="text-xs font-semibold text-ink-soft mb-1">
                {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {!isExtracted && <span className="italic text-slate-400"> (upload date — no date found on document)</span>}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => viewDocument(doc)} className="font-bold text-teal hover:underline text-left">{doc.originalFilename}</button>
                <Badge tone={CATEGORY_ICON_TONE[doc.category] || "slate"}>{doc.category}</Badge>
              </div>
              {doc.fields?.length > 0 && <div className="grid sm:grid-cols-2 gap-2">
                  {doc.fields.filter(f => f.label !== "Date").map(f => <div key={f._id} className="bg-bg rounded-lg px-3 py-2 border border-teal-light/60 text-sm">
                      <span className="text-ink-soft">{f.label}: </span>
                      <span className="font-semibold text-ink">{f.value}</span>
                    </div>)}
                </div>}
            </div>)}
        </div>
      </Card>

      <div className="space-y-5">
        <p className="text-xs font-bold text-ink-soft uppercase">All Documents — Full Detail</p>
        {patient.documents.map(doc => <Card key={doc._id} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <button onClick={() => viewDocument(doc)} className="font-bold text-teal hover:underline text-left">{doc.originalFilename}</button>
                <Badge tone="teal" className="mt-1">{doc.category}</Badge>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(doc.fields || []).map(f => <div key={f._id} className="bg-bg rounded-xl p-3 border border-teal-light/60">
                  <p className="text-xs font-semibold text-ink-soft">{f.label}</p>
                  <p className="font-semibold text-ink mb-1.5">{f.value}</p>
                  <ConfidenceBadge value={f.confidence} />
                </div>)}
            </div>
          </Card>)}
      </div>
    </div>;
}
function AyushTab({
  patient
}) {
  if (!patient.ayush || !Object.keys(patient.ayush).length) {
    return <EmptyState icon={<Leaf size={22} />} title="No AYUSH assessment recorded." message="This patient has not completed the AYUSH assessment flow." />;
  }
  const a = patient.ayush;
  const dashavidha = [["Prakriti", a.prakriti], ["Vikriti", a.vikriti], ["Sara", a.sara], ["Samhanana", a.samhanana], ["Pramana", a.pramana], ["Satmya", a.satmya], ["Sattva", a.sattva], ["Ahara Shakti", a.aharaShakti], ["Vyayama Shakti", a.vyayamaShakti], ["Vaya", a.vaya]];
  return <div className="space-y-5">
      <Card className="p-5 overflow-x-auto">
        <div className="flex items-center gap-2 mb-4"><Leaf size={18} className="text-ayur" /><p className="font-bold text-ink">Dashavidha Pariksha</p></div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-ink-soft uppercase border-b border-teal-light"><th className="py-2">Parameter</th><th className="py-2">Captured Information</th><th className="py-2">Status</th></tr></thead>
          <tbody>
            {dashavidha.map(([k, v]) => <tr key={k} className="border-b border-teal-light/50 last:border-0">
                <td className="py-2.5 font-semibold text-ink">{k}</td>
                <td className="py-2.5 text-ink-soft">{v || "—"}</td>
                <td className="py-2.5">{v && <Check size={16} className="text-success" />}</td>
              </tr>)}
          </tbody>
        </table>
      </Card>
      <div className="grid sm:grid-cols-2 gap-4">
        {[["Ahara", a.ahara], ["Vihara", a.vihara], ["Agni", a.agni], ["Koshtha", a.koshtha], ["Nidana", a.nidana], ["Samprapti", a.samprapti]].map(([k, v]) => <Card key={k} className="p-4">
            <p className="text-xs font-bold text-ink-soft uppercase mb-1.5">{k}</p>
            <p className="text-sm text-ink">{v || "—"}</p>
          </Card>)}
      </div>
    </div>;
}
function VerificationTab({
  patient,
  patientId,
  onVerified,
  currentDoctorName
}) {
  const status = patient.verificationStatus;
  const [verifyError, setVerifyError] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState("");

  const verify = () => {
    setVerifyError("");
    // FIX: attribute the verification to the real logged-in doctor, not a hardcoded name
    api.post(`/api/patients/${patientId}/verify`, {
      verifiedBy: currentDoctorName
    }).then(onVerified).catch(() => setVerifyError("Couldn't save verification. Please try again."));
  };

  const pushToHis = () => {
    setPushing(true);
    setPushError("");
    api.post(`/api/summary/${patientId}/push-to-his`, { pushedBy: currentDoctorName })
      .then(onVerified)
      .catch(err => setPushError(err.response?.data?.error?.message || "Couldn't reach the HIS gateway. Please try again."))
      .finally(() => setPushing(false));
  };

  const hisPush = patient.hisPush || { status: "not-sent" };

  return <div className="max-w-2xl">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-teal" size={20} />
          <p className="font-bold text-ink">AI Draft — Physician Verification</p>
        </div>
        <p className="text-sm text-ink-soft mb-6">
          This clinical history was generated from patient interview{patient.documents?.length ? " and uploaded documents" : ""}. Review and confirm before finalizing.
        </p>
        <div className="flex items-center gap-3 mb-6">
          <Badge tone={status === "verified" ? "success" : "warn"}>
            {status === "verified" ? `✓ Verified by ${patient.summary?.verifiedBy || currentDoctorName}` : "Pending physician verification"}
          </Badge>
        </div>
        {verifyError && <p className="text-sm text-emergency mb-4">{verifyError}</p>}
        <div className="flex flex-wrap gap-3">
          <Button onClick={verify}><Check size={16} /> Accept &amp; Confirm</Button>
          <Button variant="ghost" className="text-emergency" disabled title="Not implemented yet">
            <X size={16} /> Reject
          </Button>
        </div>
      </Card>

      {status === "verified" && <Card className="p-6 mt-5 border-success/30 bg-success/5">
          <p className="font-semibold text-ink flex items-center gap-2 mb-4">
            <Check size={16} className="text-success" /> Record confirmed and marked FHIR/ABDM-ready.
          </p>

          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-bold text-ink-soft uppercase">Hospital HIS / ABDM push</p>
            <Badge tone={hisPush.status === "sent" ? "success" : hisPush.status === "failed" ? "emergency" : "neutral"}>
              {hisPush.status === "sent" ? "✓ Sent" : hisPush.status === "failed" ? "✗ Failed" : "Not sent yet"}
            </Badge>
          </div>

          {hisPush.status === "sent" && <p className="text-sm text-ink-soft mb-4">
              Transaction <span className="font-mono text-ink">{hisPush.transactionId}</span> · pushed by {hisPush.pushedBy} on{" "}
              {new Date(hisPush.pushedAt).toLocaleString()}
            </p>}

          {pushError && <p className="text-sm text-emergency mb-3">{pushError}</p>}
          {!pushError && hisPush.status === "failed" && hisPush.errorMessage && <p className="text-sm text-emergency mb-3">{hisPush.errorMessage}</p>}

          <Button size="sm" onClick={pushToHis} disabled={pushing}>
            {pushing ? "Pushing…" : hisPush.status === "sent" ? "Push again" : "Push to HIS"}
          </Button>
          <p className="text-xs text-ink-soft mt-3">
            Note: this is a simulated push to a mock gateway — see Admin → Integrations. No real hospital HIS or the ABDM ecosystem is connected in this deployment yet.
          </p>
        </Card>}
    </div>;
}