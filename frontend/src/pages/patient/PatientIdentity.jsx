import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, IdCard, Hospital, UserPlus, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { KioskShell } from "../../components/Shells";
import { Card, Button } from "../../components/ui";
import QrScanner from "../../components/QrScanner";
import { useIntake } from "../../context/IntakeContext";
import api from "../../services/api";
import useTranslation from "../../i18n/useTranslation";

const ABHA_ID_REGEX = /^\d{14}$/;

export default function PatientIdentity() {
  const navigate = useNavigate();

  // "menu"       — the 4-option chooser (ABHA / QR / Hospital ID / New patient)
  // "form"       — demographic form (used for brand-new patients AND as the
  //                final confirm/edit step after ABHA or Hospital-ID lookup)
  // "abha-id"    — enter 14-digit ABHA number
  // "abha-otp"   — enter the OTP sent for that ABHA number
  // "qr"         — camera QR scanner
  // "hospital"   — enter a previous visit's Hospital ID (token)
  const [mode, setMode] = useState("menu");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", age: "", gender: "M", abha: "" });
  const [formError, setFormError] = useState("");
  const [welcomeBack, setWelcomeBack] = useState(false);

  // ABHA entry + OTP state
  const [abhaInput, setAbhaInput] = useState("");
  const [abhaError, setAbhaError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [maskedTarget, setMaskedTarget] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Hospital ID lookup state
  const [hospitalInput, setHospitalInput] = useState("");
  const [hospitalError, setHospitalError] = useState("");
  const [lookingUpHospital, setLookingUpHospital] = useState(false);

  const [qrError, setQrError] = useState("");

  const {
    language,
    consentFlags,
    setPatientName,
    setPatientId
  } = useIntake();
  const t = useTranslation().patientIdentity;

  const goToForm = ({ name = "", age = "", gender = "M", abha = "" } = {}, foundExisting = false) => {
    setForm({ name, age: age ? String(age) : "", gender: gender || "M", abha: abha || "" });
    setWelcomeBack(foundExisting);
    setFormError("");
    setError("");
    setMode("form");
  };

  const backToMenu = () => {
    setMode("menu");
    setAbhaInput("");
    setAbhaError("");
    setOtpInput("");
    setOtpError("");
    setDevOtp("");
    setMaskedTarget("");
    setHospitalInput("");
    setHospitalError("");
    setQrError("");
  };

  // ---------------------------------------------------------------------
  // ABHA ID + OTP flow
  // ---------------------------------------------------------------------

  const submitAbhaId = async (idValue) => {
    const cleaned = (idValue ?? abhaInput).replace(/\s+/g, "");
    setAbhaError("");
    if (!ABHA_ID_REGEX.test(cleaned)) {
      setAbhaError(t.abhaInvalid);
      return;
    }
    setAbhaInput(cleaned);
    setSendingOtp(true);
    try {
      const res = await api.post("/api/patients/abha/send-otp", { abha: cleaned });
      setMaskedTarget(res.data.data.maskedTarget);
      setDevOtp(res.data.data.devOtp || "");
      setOtpInput("");
      setOtpError("");
      setMode("abha-otp");
    } catch (err) {
      setAbhaError(err.response?.data?.error?.message || t.abhaInvalid);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyAbhaOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    if (!otpInput.trim()) {
      setOtpError(t.otpInvalid);
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await api.post("/api/patients/abha/verify-otp", { abha: abhaInput, otp: otpInput.trim() });
      const existing = res.data.data.existingPatient;
      if (existing) {
        goToForm({ ...existing, abha: abhaInput }, true);
      } else {
        goToForm({ abha: abhaInput }, false);
      }
    } catch (err) {
      setOtpError(err.response?.data?.error?.message || t.otpInvalid);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ---------------------------------------------------------------------
  // QR flow — decoded text is expected to be (or contain) a 14-digit
  // ABHA number, same as manual entry, then continues into the OTP step.
  // ---------------------------------------------------------------------

  const handleQrScan = (decodedText) => {
    const digitsOnly = decodedText.replace(/\D+/g, "");
    const match = digitsOnly.match(/\d{14}/);
    if (!match) {
      setQrError(t.qrUnrecognized);
      return;
    }
    setQrError("");
    setMode("abha-id");
    submitAbhaId(match[0]);
  };

  // ---------------------------------------------------------------------
  // Hospital ID (visit token) lookup
  // ---------------------------------------------------------------------

  const submitHospitalId = async (e) => {
    e.preventDefault();
    const cleaned = hospitalInput.trim();
    setHospitalError("");
    if (!cleaned) {
      setHospitalError(t.hospitalIdRequired);
      return;
    }
    setLookingUpHospital(true);
    try {
      const res = await api.get(`/api/patients/lookup/hospital-id/${encodeURIComponent(cleaned)}`);
      goToForm(res.data.data, true);
    } catch (err) {
      setHospitalError(err.response?.data?.error?.message || t.hospitalNotFound);
    } finally {
      setLookingUpHospital(false);
    }
  };

  // ---------------------------------------------------------------------
  // Final registration (shared by new patients and prefilled lookups)
  // ---------------------------------------------------------------------

  const registerPatient = async ({ name, age, gender, abha }) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/patients", {
        name, age, gender, language, abha: abha || undefined
      });
      const newPatientId = res.data.data.id;
      setPatientName(name);
      setPatientId(newPatientId);
      api.post(`/api/patients/${newPatientId}/consent`, consentFlags).catch(() => {});
      navigate("/patient/intake");
    } catch (err) {
      setError("Could not reach the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setFormError("Please enter your name.");
      return;
    }
    const ageNum = form.age ? Number(form.age) : undefined;
    if (form.age && (Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 120)) {
      setFormError("Please enter a valid age.");
      return;
    }
    await registerPatient({ name: trimmedName, age: ageNum, gender: form.gender, abha: form.abha.trim() });
  };

  // =======================================================================
  // Render: form (new patient OR confirm/edit after ABHA / Hospital-ID lookup)
  // =======================================================================
  if (mode === "form") {
    return <KioskShell step={3} total={8}>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="max-w-xl w-full animate-rise">
            <button
              type="button"
              onClick={backToMenu}
              className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4"
            >
              <ArrowLeft size={16} /> {t.backBtn}
            </button>

            <h1 className="text-2xl md:text-3xl font-extrabold text-ink text-center mb-2">{t.formTitle}</h1>
            <p className="text-ink-soft text-center mb-8">{t.formSubtitle}</p>

            {welcomeBack && <div className="flex items-center gap-2 justify-center bg-teal-light/40 text-teal text-sm font-semibold rounded-xl px-4 py-2.5 mb-6">
                <CheckCircle2 size={16} /> {t.welcomeBack.replace("{name}", form.name || "")}
              </div>}

            <Card className="p-6">
              <form onSubmit={submitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">{t.fullName}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder={t.fullNamePlaceholder}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">{t.age}</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={form.age}
                      onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))}
                      className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                      placeholder={t.agePlaceholder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">{t.gender}</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    >
                      <option value="M">{t.male}</option>
                      <option value="F">{t.female}</option>
                      <option value="Other">{t.other}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">{t.abhaFieldLabel}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.abha}
                    onChange={(e) => setForm(f => ({ ...f, abha: e.target.value.replace(/\D+/g, "").slice(0, 14) }))}
                    className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder={t.abhaFieldPlaceholder}
                  />
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? t.registering : t.continueBtn}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </KioskShell>;
  }

  // =======================================================================
  // Render: ABHA ID entry
  // =======================================================================
  if (mode === "abha-id") {
    return <KioskShell step={3} total={8}>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="max-w-xl w-full animate-rise">
            <button type="button" onClick={backToMenu} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4">
              <ArrowLeft size={16} /> {t.backBtn}
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink text-center mb-2">{t.abhaEntryTitle}</h1>
            <p className="text-ink-soft text-center mb-8">{t.abhaEntrySubtitle}</p>
            <Card className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); submitAbhaId(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">{t.abhaInputLabel}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={abhaInput}
                    onChange={(e) => setAbhaInput(e.target.value.replace(/\D+/g, "").slice(0, 14))}
                    className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-lg tracking-widest text-ink outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder={t.abhaInputPlaceholder}
                  />
                </div>
                {abhaError && <p className="text-sm text-red-600">{abhaError}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={sendingOtp}>
                  {sendingOtp ? t.sendingOtp : t.sendOtpBtn}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </KioskShell>;
  }

  // =======================================================================
  // Render: OTP verification
  // =======================================================================
  if (mode === "abha-otp") {
    return <KioskShell step={3} total={8}>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="max-w-xl w-full animate-rise">
            <button type="button" onClick={() => setMode("abha-id")} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4">
              <ArrowLeft size={16} /> {t.backBtn}
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink text-center mb-2">{t.otpTitle}</h1>
            <p className="text-ink-soft text-center mb-2">{t.otpSubtitle.replace("{target}", maskedTarget)}</p>
            {devOtp && <p className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-6">
                {t.devOtpHint.replace("{otp}", devOtp)}
              </p>}
            <Card className="p-6">
              <form onSubmit={verifyAbhaOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">{t.otpInputLabel}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D+/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-lg tracking-widest text-center text-ink outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder="••••••"
                  />
                </div>
                {otpError && <p className="text-sm text-red-600">{otpError}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={verifyingOtp}>
                  {verifyingOtp ? t.verifyingOtp : t.verifyOtpBtn}
                </Button>
                <button
                  type="button"
                  onClick={() => submitAbhaId(abhaInput)}
                  className="w-full text-center text-sm text-teal hover:underline"
                  disabled={sendingOtp}
                >
                  {t.resendOtp}
                </button>
              </form>
            </Card>
          </div>
        </div>
      </KioskShell>;
  }

  // =======================================================================
  // Render: QR scanner
  // =======================================================================
  if (mode === "qr") {
    return <KioskShell step={3} total={8}>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="max-w-xl w-full animate-rise">
            <button type="button" onClick={backToMenu} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4">
              <ArrowLeft size={16} /> {t.backBtn}
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink text-center mb-2">{t.qrTitle}</h1>
            <p className="text-ink-soft text-center mb-6">{t.qrDesc}</p>
            <QrScanner onScan={handleQrScan} onCancel={backToMenu} hint={t.qrHint} />
            {qrError && <p className="text-sm text-red-600 text-center mt-4">{qrError}</p>}
            <button type="button" onClick={() => setMode("abha-id")} className="w-full text-center text-sm text-teal hover:underline mt-4">
              {t.qrManualFallback}
            </button>
          </div>
        </div>
      </KioskShell>;
  }

  // =======================================================================
  // Render: Hospital ID entry
  // =======================================================================
  if (mode === "hospital") {
    return <KioskShell step={3} total={8}>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="max-w-xl w-full animate-rise">
            <button type="button" onClick={backToMenu} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4">
              <ArrowLeft size={16} /> {t.backBtn}
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink text-center mb-2">{t.hospitalEntryTitle}</h1>
            <p className="text-ink-soft text-center mb-8">{t.hospitalEntrySubtitle}</p>
            <Card className="p-6">
              <form onSubmit={submitHospitalId} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">{t.hospitalInputLabel}</label>
                  <input
                    type="text"
                    autoFocus
                    value={hospitalInput}
                    onChange={(e) => setHospitalInput(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-lg tracking-wide text-ink outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder={t.hospitalInputPlaceholder}
                  />
                </div>
                {hospitalError && <p className="text-sm text-red-600">{hospitalError}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={lookingUpHospital}>
                  {lookingUpHospital ? t.lookingUp : t.lookupBtn}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </KioskShell>;
  }

  // =======================================================================
  // Render: main menu
  // =======================================================================
  return <KioskShell step={3} total={8}>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-3xl w-full animate-rise">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink text-center mb-2">{t.title}</h1>
          <p className="text-ink-soft text-center mb-8">{t.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 cursor-pointer hover:shadow-soft hover:border-teal" onClick={() => setMode("abha-id")}>
              <IdCard className="text-teal mb-3" size={26} />
              <p className="font-bold text-ink mb-1">{t.abhaTitle}</p>
              <p className="text-sm text-ink-soft">{t.abhaDesc}</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:shadow-soft hover:border-teal" onClick={() => setMode("qr")}>
              <QrCode className="text-teal mb-3" size={26} />
              <p className="font-bold text-ink mb-1">{t.qrCardTitle}</p>
              <p className="text-sm text-ink-soft">{t.qrDesc}</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:shadow-soft hover:border-teal" onClick={() => setMode("hospital")}>
              <Hospital className="text-teal mb-3" size={26} />
              <p className="font-bold text-ink mb-1">{t.hospitalTitle}</p>
              <p className="text-sm text-ink-soft">{t.hospitalDesc}</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:shadow-soft hover:border-teal" onClick={() => goToForm()}>
              <UserPlus className="text-teal mb-3" size={26} />
              <p className="font-bold text-ink mb-1">{t.newPatientTitle}</p>
              <p className="text-sm text-ink-soft">{t.newPatientDesc}</p>
            </Card>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-ink-soft mb-6">
            <ShieldCheck size={16} className="text-teal" /> {t.privacyProtected}
          </div>

          <div className="flex justify-center">
            <Button size="lg" onClick={() => goToForm()}>
              {t.registerBtn}
            </Button>
          </div>
        </div>
      </div>
    </KioskShell>;
}