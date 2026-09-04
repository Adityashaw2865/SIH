import React, { createContext, useContext, useState } from "react";
const IntakeContext = createContext(null);
const defaultAccessibility = {
  audioGuidance: true,
  largeText: false,
  highContrast: false,
  largeButtons: true,
  slowVoice: false,
  assistedMode: false
};
export function IntakeProvider({
  children
}) {
  // FIX: kiosk ab default English mein khulta hai (pehle "Hindi" tha, jiski
  // wajah se /patient/start language-select se pehle hi Hindi dikhta tha).
  // Patient LanguageSelect page pe jaake apni pasand ki language chun sakta hai.
  const [language, setLanguage] = useState("English");
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentFlags, setConsentFlags] = useState({
    historyCapture: false,
    documentProcessing: false,
    providerSharing: false
  });
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState(null);
  const [redFlagTriggered, setRedFlagTriggered] = useState(false);
  const [accessibility, setAccessibility] = useState(defaultAccessibility);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  function updateAccessibility(partial) {
    setAccessibility(prev => ({
      ...prev,
      ...partial
    }));
  }
  // Clears every piece of this patient's session data from memory the
  // moment their intake is submitted, so the next patient on this shared
  // kiosk never sees a trace of the previous patient's name, answers, or
  // consent choices (spec 3.3 Module D — "Session termination: temporary
  // session data is cleared immediately after submission"). Deliberately
  // does NOT reset accessibility/accessibilityOpen — those are kiosk
  // hardware preferences (large text, slow voice, etc.), not patient data,
  // and should persist for whoever uses the kiosk next.
  function resetSession() {
    // FIX: reset bhi English pe hi hona chahiye, warna Hindi wapas aa jaata.
    setLanguage("English");
    setConsentGiven(false);
    setConsentFlags({
      historyCapture: false,
      documentProcessing: false,
      providerSharing: false
    });
    setPatientName("");
    setPatientId(null);
    setRedFlagTriggered(false);
  }
  return <IntakeContext.Provider value={{
    language,
    setLanguage,
    consentGiven,
    setConsentGiven,
    consentFlags,
    setConsentFlags,
    patientName,
    setPatientName,
    patientId,
    setPatientId,
    redFlagTriggered,
    setRedFlagTriggered,
    accessibility,
    updateAccessibility,
    accessibilityOpen,
    setAccessibilityOpen,
    resetSession
  }}>
      {children}
    </IntakeContext.Provider>;
}
export function useIntake() {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error("useIntake must be used within IntakeProvider");
  return ctx;
}