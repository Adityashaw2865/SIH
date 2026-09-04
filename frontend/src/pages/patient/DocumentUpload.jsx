import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, FileUp, Image as ImageIcon, FileText, Pill, FlaskConical, Stethoscope, Scissors, MoreHorizontal, Loader2 } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button } from "../../components/ui";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import useTranslation from "../../i18n/useTranslation";

const categoryKeys = ["Prescription", "Lab Report", "Discharge Summary", "Imaging Report", "Surgery Record", "Other"];
const categoryIcons = {
  "Prescription": Pill,
  "Lab Report": FlaskConical,
  "Discharge Summary": Stethoscope,
  "Imaging Report": ImageIcon,
  "Surgery Record": Scissors,
  "Other": MoreHorizontal
};

export default function DocumentUpload() {
  const navigate = useNavigate();
  const { patientId } = useIntake();
  const t = useTranslation().documentUpload;
  const [selected, setSelected] = useState(null);
  const [uploaded, setUploaded] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const pendingFileRef = useRef(null);

  const pickFile = (accept) => {
    setError(null);
    // Default to "Other" if the user hasn't tapped a category chip yet —
    // they can still change the category before this upload by picking a
    // chip first; this just avoids silently blocking the file picker.
    if (!selected) setSelected("Other");
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || "";
      fileInputRef.current.click();
    }
  };

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    pendingFileRef.current = file;
    uploadDocument(file);
  };

  const uploadDocument = async (file) => {
    if (!patientId) {
      setError("No patient session found. Please restart intake.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", selected);
      // Let axios/browser set Content-Type + boundary automatically for
      // FormData — manually setting "multipart/form-data" here drops the
      // boundary param and breaks multer's parsing on the backend.
      const res = await api.post(`/api/documents/${patientId}/upload`, formData);
      setUploaded(u => [...u, { category: selected, filename: file.name, doc: res.data.data }]);
      setSelected(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return <KioskShell step={6} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full animate-rise">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink text-center mb-2">
            {t.title}
          </h1>
          <p className="text-ink-soft text-center mb-8">{t.subtitle}</p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChosen}
            style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
          />

          <div className="grid sm:grid-cols-4 gap-3 mb-8">
            {[{
            icon: Camera,
            label: t.scanCamera,
            accept: "image/*",
            capture: "environment"
          }, {
            icon: FileUp,
            label: t.uploadDocument,
            accept: "image/*,application/pdf"
          }, {
            icon: ImageIcon,
            label: t.uploadImage,
            accept: "image/*"
          }, {
            icon: FileText,
            label: t.uploadPdf,
            accept: "application/pdf"
          }].map(o => <Card key={o.label} className="p-4 text-center cursor-pointer hover:shadow-soft hover:border-teal" onClick={() => pickFile(o.accept)}>
                <o.icon className="text-teal mx-auto mb-2" size={22} />
                <p className="text-xs font-semibold text-ink">{o.label}</p>
              </Card>)}
          </div>

          <p className="font-semibold text-ink text-sm mb-3">{t.whatType}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
            {categoryKeys.map(key => {
              const Icon = categoryIcons[key];
              return <button key={key} onClick={() => setSelected(key)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-colors ${selected === key ? "border-teal bg-teal-light/40 text-teal" : "border-teal-light text-ink-soft hover:border-teal/40"}`}>
                <Icon size={18} />
                {t.categories[key]}
              </button>;
            })}
          </div>

          {error && <div className="mb-4 bg-emergency/5 border border-emergency/20 rounded-xl px-4 py-2.5 text-sm font-medium text-emergency text-center">
              {error}
            </div>}

          {uploaded.length > 0 && <div className="mb-6 space-y-2">
              {uploaded.map((u, i) => <div key={i} className="flex items-center gap-2 bg-success/5 border border-success/20 rounded-xl px-4 py-2.5 text-sm font-medium text-ink">
                  <FileText size={16} className="text-success" /> {t.categories[u.category] || u.category}: {u.filename} {t.uploadedSuccess}
                </div>)}
            </div>}

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => pickFile()} disabled={!selected || uploading}>
              {uploading ? <><Loader2 className="animate-spin" size={16} /> {t.uploading}</> : t.uploadSelected}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/patient/document-review", { state: { documents: uploaded.map(u => u.doc) } })} disabled={uploading}>
              {uploaded.length > 0 ? t.continueReview : t.skipNoDocuments}
            </Button>
          </div>
        </div>
      </div>
    </KioskShell>;
}