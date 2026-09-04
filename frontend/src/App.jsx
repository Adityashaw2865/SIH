import { HashRouter, Routes, Route } from "react-router-dom";
import { IntakeProvider } from "./context/IntakeContext";
import IdleSessionGuard from "./components/IdleSessionGuard";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import { About, Privacy, Help, NotFound } from "./pages/StaticPages";
import PatientStart from "./pages/patient/PatientStart";
import LanguageSelect from "./pages/patient/LanguageSelect";
import Consent from "./pages/patient/Consent";
import ManageConsent from "./pages/patient/ManageConsent";
import PatientIdentity from "./pages/patient/PatientIdentity";
import PatientIntake from "./pages/patient/PatientIntake";
import AyushAssessment from "./pages/patient/AyushAssessment";
import DocumentUpload from "./pages/patient/DocumentUpload";
import DocumentReview from "./pages/patient/DocumentReview";
import PatientReview from "./pages/patient/PatientReview";
import PatientComplete from "./pages/patient/PatientComplete";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorPatientDetail from "./pages/doctor/DoctorPatientDetail";
import TriageDashboard from "./pages/triage/TriageDashboard";
export default function App() {
  return <IntakeProvider>
      <HashRouter>
        <IdleSessionGuard />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help" element={<Help />} />

          <Route path="/patient/start" element={<PatientStart />} />
          <Route path="/patient/language" element={<LanguageSelect />} />
          <Route path="/patient/consent" element={<Consent />} />
          <Route path="/patient/identity" element={<PatientIdentity />} />
          <Route path="/patient/intake" element={<PatientIntake />} />
          <Route path="/patient/manage-consent" element={<ManageConsent />} />
          <Route path="/patient/ayush" element={<AyushAssessment />} />
          <Route path="/patient/documents" element={<DocumentUpload />} />
          <Route path="/patient/document-review" element={<DocumentReview />} />
          <Route path="/patient/review" element={<PatientReview />} />
          <Route path="/patient/complete" element={<PatientComplete />} />

          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/patient/:id" element={<DoctorPatientDetail />} />

          <Route path="/triage/dashboard" element={<TriageDashboard />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </IntakeProvider>;
}