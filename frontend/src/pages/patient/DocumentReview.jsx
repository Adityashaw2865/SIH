import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, Edit3 } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button, ConfidenceBadge } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import useTranslation from "../../i18n/useTranslation";

export default function DocumentReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useIntake();
  const t = useTranslation().documentReview;
  const stages = t.stages;
  const [stageIndex, setStageIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(null);

  // Documents (with real OCR-extracted fields) passed forward from
  // DocumentUpload's "Continue to Review" — each doc has category,
  // originalFilename, and a fields[] array of { _id, label, value,
  // confidence, status }, matching the backend's ExtractedFieldSchema.
  const documents = location.state?.documents || [];
  const hasDocuments = documents.length > 0;

  useEffect(() => {
    if (!hasDocuments) {
      setDone(true);
      return;
    }
    if (stageIndex < stages.length - 1) {
      const t = setTimeout(() => setStageIndex(s => s + 1), 550);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setDone(true), 550);
      return () => clearTimeout(t);
    }
  }, [stageIndex, hasDocuments]);

  const updateField = async (documentId, field, patch) => {
    setSaving(field._id);
    try {
      await api.patch(`/api/documents/${patientId}/${documentId}/fields/${field._id}`, patch);
    } catch (err) {
      // Non-fatal for the kiosk flow — the field still updates locally so
      // the patient isn't blocked; staff can re-verify from the doctor view.
      console.error("Failed to save field update:", err);
    } finally {
      setSaving(null);
    }
  };

  const confirmField = (documentId, field) => {
    field.status = "confirmed";
    updateField(documentId, field, { status: "confirmed" });
    forceRerender();
  };

  const startEdit = (field) => {
    setEditingId(field._id);
    setEditValue(field.value);
  };

  const saveEdit = (documentId, field) => {
    field.value = editValue;
    field.status = "edited";
    updateField(documentId, field, { value: editValue, status: "edited" });
    setEditingId(null);
    forceRerender();
  };

  // documents is plain JS from navigation state (not React state), so
  // mutating a field in place needs an explicit re-render trigger.
  const [, setTick] = useState(0);
  const forceRerender = () => setTick(t => t + 1);

  if (!hasDocuments) {
    return <KioskShell step={6} total={8}>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <Card className="max-w-md w-full p-8 text-center animate-rise">
            <p className="font-bold text-ink text-lg mb-2">{t.noDocsTitle}</p>
            <p className="text-ink-soft text-sm mb-6">{t.noDocsDesc}</p>
            <Button size="lg" onClick={() => navigate("/patient/review")}>{t.continueBtn}</Button>
          </Card>
        </div>
      </KioskShell>;
  }

  if (!done) {
    return <KioskShell step={6} total={8}>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <Card className="max-w-md w-full p-8 text-center">
            <p className="font-bold text-ink text-lg mb-6">{t.processingTitle}</p>
            <ul className="space-y-3 text-left">
              {stages.map((s, i) => <li key={s} className="flex items-center gap-3 text-sm">
                  {i < stageIndex ? <Check size={16} className="text-success shrink-0" /> : i === stageIndex ? <span className="w-4 h-4 rounded-full border-2 border-teal border-t-transparent animate-spin shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />}
                  <span className={i <= stageIndex ? "font-medium text-ink" : "text-slate-400"}>{s}</span>
                </li>)}
            </ul>
          </Card>
        </div>
      </KioskShell>;
  }

  return <KioskShell step={6} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full animate-rise space-y-8">
          {documents.map(doc => <div key={doc._id}>
              <h1 className="text-xl font-extrabold text-ink mb-1">
                {doc.category}{doc.originalFilename ? ` — ${doc.originalFilename}` : ""}
              </h1>
              <p className="text-ink-soft text-sm mb-6">{t.reviewInstructions}</p>

              <div className="space-y-3">
                {(doc.fields || []).length === 0 && <p className="text-sm text-ink-soft">{t.noFields}</p>}
                {(doc.fields || []).map(f => <Card key={f._id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-xs font-semibold text-ink-soft">{f.label}</p>
                      {editingId === f._id ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className="mt-1 w-full border-2 border-teal rounded-lg px-2 py-1 font-bold text-ink" /> : <p className="font-bold text-ink">{f.value}</p>}
                      <div className="mt-1"><ConfidenceBadge value={f.confidence} /></div>
                    </div>
                    <div className="flex gap-2">
                      {editingId === f._id ? <button onClick={() => saveEdit(doc._id, f)} className="min-h-[40px] px-3 rounded-lg text-xs font-semibold bg-success/10 text-success flex items-center gap-1">
                          <Check size={14} /> {t.saveBtn}
                        </button> : <>
                          <button onClick={() => confirmField(doc._id, f)} disabled={saving === f._id} className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1 ${f.status === "confirmed" ? "bg-success/10 text-success" : "bg-teal-light text-teal"}`}>
                            <Check size={14} /> {f.status === "confirmed" ? t.confirmedBtn : t.confirmBtn}
                          </button>
                          <button onClick={() => startEdit(f)} disabled={saving === f._id} className="min-h-[40px] px-3 rounded-lg text-xs font-semibold bg-slate-100 text-ink-soft flex items-center gap-1">
                            <Edit3 size={14} /> {t.editBtn}
                          </button>
                        </>}
                    </div>
                  </Card>)}
              </div>
            </div>)}

          <div className="flex justify-center">
            <Button size="lg" onClick={() => navigate("/patient/review")}>{t.continueBtn}</Button>
          </div>
        </div>
      </div>
    </KioskShell>;
}