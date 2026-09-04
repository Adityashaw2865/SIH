// Central translation dictionary for MediKiosk patient-facing pages.
// Keyed by the same language display-name strings stored in IntakeContext
// (e.g. "Hindi", "English", "Bengali" ...) so pages can do:
//   import useTranslation from "../../i18n/useTranslation";
//   const t = useTranslation();
//   <h1>{t.consent.title}</h1>
//
// NOTE: The dynamic clinical question flows in PatientIntake.jsx (chest
// pain / fever / etc.) live in a separate dictionary — see
// ../i18n/intakeQA.js (QUESTION_HI / OPTION_HI / SECTION_HI) — since they're
// keyed by the canonical English question/option text rather than by a
// translation-tree path. The `patientIntake` block below covers only the
// static UI chrome around that flow (sidebar labels, voice hints, the
// priority-alert screen).
//
// Bengali, Marathi, Tamil, Telugu, Kannada, Gujarati are still pending —
// only English and Hindi are filled in right now.

const translations = {
  English: {
    common: { back: "Back", continue: "Continue", loading: "Loading...", save: "Save" },
    patientStart: {
      welcome: "Welcome to MediKiosk",
      subtitle: "Let's prepare your medical history before you meet the doctor.",
      newPatientTitle: "New Patient",
      newPatientDesc: "First visit — register your details.",
      existingPatientTitle: "Existing Patient",
      existingPatientDesc: "Continue with your ABHA or hospital ID.",
      assistedTitle: "Assisted Mode",
      assistedDesc: "Hospital staff will help you through this.",
      needHelp: "Need help?"
    },
    languageSelect: { title: "Choose your preferred language" },
    consent: {
      title: "Your Privacy Matters",
      intro: "We will collect information about your health to prepare your medical history for the doctor.",
      whatWeCollect: "What we collect",
      collectItems: ["Symptoms", "Medical history", "Medicines", "Allergies", "Previous medical documents"],
      whyWeCollect: "Why we collect it",
      whyItems: ["To prepare your clinical history", "To help the doctor review your information", "To improve continuity of care"],
      choicesTitle: "Your choices",
      consentHistory: "I consent to clinical history capture",
      consentDocs: "I consent to document processing",
      consentSharing: "I consent to sharing with authorized healthcare provider",
      listen: "Listen to consent",
      revokeNote: "Consent can be revoked according to applicable policy.",
      understand: "I Understand & Give Consent",
      needAssistance: "I Need Assistance"
    },
    patientIdentity: {
      title: "How would you like to identify yourself?",
      subtitle: "Choose any one option to continue.",
      abhaTitle: "ABHA ID", abhaDesc: "Enter your 14-digit ABHA number.",
      qrCardTitle: "Scan ABHA QR", qrTitle: "Scan ABHA QR", qrDesc: "Use the kiosk camera to scan your QR code.",
      hospitalTitle: "Hospital ID", hospitalDesc: "Enter your hospital registration number.",
      newPatientTitle: "New Patient", newPatientDesc: "Register your basic information.",
      comingSoon: "Coming soon",
      privacyProtected: "Privacy protected",
      registerBtn: "Register as New Patient",
      formTitle: "Register your details",
      formSubtitle: "This information will be shared with your treating doctor.",
      fullName: "Full name *", fullNamePlaceholder: "Enter your full name",
      age: "Age", agePlaceholder: "e.g. 42",
      gender: "Gender", male: "Male", female: "Female", other: "Other",
      continueBtn: "Continue", registering: "Registering...", backBtn: "Back",
      abhaEntryTitle: "Enter your ABHA ID",
      abhaEntrySubtitle: "We'll send a one-time code to verify it's you.",
      abhaInputLabel: "14-digit ABHA number",
      abhaInputPlaceholder: "e.g. 12345678901234",
      abhaInvalid: "Please enter a valid 14-digit ABHA number.",
      sendOtpBtn: "Send OTP", sendingOtp: "Sending code...",
      otpTitle: "Enter the code",
      otpSubtitle: "We sent a 6-digit code to the mobile number linked to {target}.",
      otpInputLabel: "6-digit code",
      otpInvalid: "That code is incorrect or has expired. Please try again.",
      verifyOtpBtn: "Verify & Continue", verifyingOtp: "Verifying...",
      resendOtp: "Didn't get it? Resend code",
      devOtpHint: "Demo mode (no SMS gateway configured) — your code is {otp}",
      qrDescLong: "Use the kiosk camera to scan your ABHA QR code.",
      qrHint: "Point the camera at your ABHA QR code",
      qrUnrecognized: "Couldn't read an ABHA number from that QR code. Please try again or enter it manually.",
      qrManualFallback: "Enter ABHA ID manually instead",
      hospitalEntryTitle: "Enter your Hospital ID",
      hospitalEntrySubtitle: "This is the ID printed on your token from a previous visit.",
      hospitalInputLabel: "Hospital ID",
      hospitalInputPlaceholder: "e.g. TKN-ABC123",
      hospitalIdRequired: "Please enter your Hospital ID.",
      hospitalNotFound: "No record found for that Hospital ID. Please check and try again, or register as a new patient.",
      lookupBtn: "Look Up", lookingUp: "Looking up...",
      welcomeBack: "Welcome back, {name}! We've filled in your details below — please check them before continuing.",
      abhaFieldLabel: "ABHA ID (optional)",
      abhaFieldPlaceholder: "14-digit ABHA number, if you have one"
    },
    documentUpload: {
      title: "Bring your previous records into one timeline",
      subtitle: "Do you have any previous prescriptions or reports?",
      scanCamera: "Scan with Camera", uploadDocument: "Upload Document",
      uploadImage: "Upload Image", uploadPdf: "Upload PDF",
      whatType: "What type of document is this?",
      categories: { Prescription: "Prescription", "Lab Report": "Lab Report", "Discharge Summary": "Discharge Summary", "Imaging Report": "Imaging Report", "Surgery Record": "Surgery Record", Other: "Other" },
      uploadSelected: "Upload Selected Document", uploading: "Uploading & extracting…",
      continueReview: "Continue to Review", skipNoDocuments: "Skip — I have no documents",
      uploadedSuccess: "uploaded successfully"
    },
    documentReview: {
      processingTitle: "We're organizing your medical records...",
      stages: ["Reading document", "Extracting text", "Understanding medical information", "Building timeline", "Preparing summary"],
      noDocsTitle: "No documents to review",
      noDocsDesc: "You didn't upload any documents, so there's nothing to confirm here.",
      reviewInstructions: "Please check the information we found. You can confirm or correct anything.",
      noFields: "No fields could be extracted from this document.",
      confirmBtn: "Confirm", confirmedBtn: "Confirmed", editBtn: "Edit", saveBtn: "Save",
      continueBtn: "Continue"
    },
    patientReview: {
      title: "Let's review what you've told us",
      subtitleHi: "Hi", subtitleRest: "please check this before we send it to your doctor.",
      loadingDetails: "Loading your details...",
      errorLoading: "Couldn't load your details right now. You can still submit — your doctor will confirm everything with you directly.",
      readyMsg: "Everything looks ready for your doctor.",
      confirmSubmit: "Confirm & Submit",
      chiefComplaint: "Chief Complaint", duration: "Duration",
      documentsAdded: "Documents added", ayushAssessment: "AYUSH assessment",
      completed: "Completed", notDone: "Not done", notRecorded: "Not recorded"
    },
    patientComplete: {
      title: "All Done!",
      message: "Your medical history has been recorded and shared securely with your doctor. Please proceed to the waiting area.",
      encrypted: "Your data is encrypted and secure.",
      finish: "Finish"
    },
    manageConsent: {
      title: "Manage Your Consent",
      subtitle: "You can review and change your consent choices at any time during your visit.",
      historyCapture: "Clinical history capture", historyCaptureDesc: "Recording your symptoms and medical history through this kiosk.",
      documentProcessing: "Document processing", documentProcessingDesc: "Scanning and extracting information from your uploaded prescriptions/reports.",
      sharing: "Sharing with your doctor", sharingDesc: "Sharing your recorded history and documents with your treating doctor.",
      revokedWarning: "Revoking a consent you've already relied on (e.g. history capture) means we'll stop that activity going forward, but won't undo what's already been recorded. Your doctor will be notified of this change.",
      saveChanges: "Save Changes", savingBtn: "Saving...",
      updated: "Your consent choices have been updated.", continueBtn: "Continue"
    },
    ayushAssessment: {
      title: "AYUSH Clinical Assessment",
      subtitle: "This assessment captures additional information used in AYUSH clinical practice.",
      progress: "Assessment progress",
      listen: "Listen", speak: "Speak", listening: "Listening…"
    },
    patientIntake: {
      sidebarHeading: "Clinical History",
      ayushSidebarItem: "AYUSH Assessment",
      aiLabel: "MediKiosk AI",
      patientFallback: "Patient",
      listenAria: "Listen to question",
      speakAria: "Speak your answer",
      listening: "Listening...",
      voiceHintSupported: "You can speak or tap an answer.",
      voiceHintUnsupported: "Voice input isn't supported in this browser — please tap an answer.",
      voiceNoMatch: "Heard \"{heard}\" — couldn't match it to an option. Please try again or tap an answer.",
      priorityAlertTitle: "🚨 PRIORITY ALERT",
      priorityAlertBody: "Some symptoms you reported may require urgent clinical assessment.",
      priorityAlertNote: "Please wait for a healthcare professional. Staff have been notified.",
      alertTriageBtn: "Alert Triage Staff",
      continueAssistedBtn: "Continue Only With Assisted Support"
    }
  },

  Hindi: {
    common: { back: "वापस", continue: "आगे बढ़ें", loading: "लोड हो रहा है...", save: "सेव करें" },
    patientStart: {
      welcome: "मेडीकियोस्क में आपका स्वागत है",
      subtitle: "डॉक्टर से मिलने से पहले आइए आपका चिकित्सा इतिहास तैयार करें।",
      newPatientTitle: "नया मरीज़",
      newPatientDesc: "पहली बार आए हैं — अपनी जानकारी दर्ज करें।",
      existingPatientTitle: "पुराना मरीज़",
      existingPatientDesc: "अपने ABHA या हॉस्पिटल आईडी से जारी रखें।",
      assistedTitle: "सहायता प्राप्त मोड",
      assistedDesc: "अस्पताल का स्टाफ आपकी मदद करेगा।",
      needHelp: "मदद चाहिए?"
    },
    languageSelect: { title: "अपनी पसंदीदा भाषा चुनें" },
    consent: {
      title: "आपकी गोपनीयता मायने रखती है",
      intro: "डॉक्टर के लिए आपका चिकित्सा इतिहास तैयार करने हेतु हम आपके स्वास्थ्य से जुड़ी जानकारी एकत्र करेंगे।",
      whatWeCollect: "हम क्या एकत्र करते हैं",
      collectItems: ["लक्षण", "चिकित्सा इतिहास", "दवाइयाँ", "एलर्जी", "पुराने चिकित्सा दस्तावेज़"],
      whyWeCollect: "हम इसे क्यों एकत्र करते हैं",
      whyItems: ["आपका क्लिनिकल इतिहास तैयार करने के लिए", "डॉक्टर को आपकी जानकारी समझने में मदद के लिए", "देखभाल की निरंतरता बेहतर बनाने के लिए"],
      choicesTitle: "आपकी सहमति",
      consentHistory: "मैं क्लिनिकल इतिहास दर्ज करने के लिए सहमति देता/देती हूँ",
      consentDocs: "मैं दस्तावेज़ प्रोसेसिंग के लिए सहमति देता/देती हूँ",
      consentSharing: "मैं अधिकृत स्वास्थ्य सेवा प्रदाता के साथ साझा करने के लिए सहमति देता/देती हूँ",
      listen: "सहमति सुनें",
      revokeNote: "लागू नीति के अनुसार सहमति वापस ली जा सकती है।",
      understand: "मैं समझता/समझती हूँ और सहमति देता/देती हूँ",
      needAssistance: "मुझे सहायता चाहिए"
    },
    patientIdentity: {
      title: "आप अपनी पहचान कैसे बताना चाहेंगे?",
      subtitle: "आगे बढ़ने के लिए कोई एक विकल्प चुनें।",
      abhaTitle: "ABHA आईडी", abhaDesc: "अपना 14-अंकों का ABHA नंबर दर्ज करें।",
      qrCardTitle: "ABHA QR स्कैन करें", qrTitle: "ABHA QR स्कैन करें", qrDesc: "अपना QR कोड स्कैन करने के लिए कियोस्क कैमरे का उपयोग करें।",
      hospitalTitle: "हॉस्पिटल आईडी", hospitalDesc: "अपना अस्पताल पंजीकरण नंबर दर्ज करें।",
      newPatientTitle: "नया मरीज़", newPatientDesc: "अपनी बुनियादी जानकारी दर्ज करें।",
      comingSoon: "जल्द आ रहा है",
      privacyProtected: "गोपनीयता सुरक्षित",
      registerBtn: "नए मरीज़ के रूप में पंजीकरण करें",
      formTitle: "अपनी जानकारी दर्ज करें",
      formSubtitle: "यह जानकारी आपके इलाज करने वाले डॉक्टर के साथ साझा की जाएगी।",
      fullName: "पूरा नाम *", fullNamePlaceholder: "अपना पूरा नाम दर्ज करें",
      age: "उम्र", agePlaceholder: "जैसे 42",
      gender: "लिंग", male: "पुरुष", female: "महिला", other: "अन्य",
      continueBtn: "आगे बढ़ें", registering: "पंजीकरण हो रहा है...", backBtn: "वापस",
      abhaEntryTitle: "अपनी ABHA आईडी दर्ज करें",
      abhaEntrySubtitle: "यह पुष्टि करने के लिए कि यह आप ही हैं, हम एक बार का कोड भेजेंगे।",
      abhaInputLabel: "14-अंकों का ABHA नंबर",
      abhaInputPlaceholder: "जैसे 12345678901234",
      abhaInvalid: "कृपया एक वैध 14-अंकों का ABHA नंबर दर्ज करें।",
      sendOtpBtn: "OTP भेजें", sendingOtp: "कोड भेजा जा रहा है...",
      otpTitle: "कोड दर्ज करें",
      otpSubtitle: "हमने {target} से जुड़े मोबाइल नंबर पर 6-अंकों का कोड भेजा है।",
      otpInputLabel: "6-अंकों का कोड",
      otpInvalid: "यह कोड गलत है या समाप्त हो गया है। कृपया फिर से प्रयास करें।",
      verifyOtpBtn: "पुष्टि करें और आगे बढ़ें", verifyingOtp: "पुष्टि हो रही है...",
      resendOtp: "कोड नहीं मिला? दोबारा भेजें",
      devOtpHint: "डेमो मोड (SMS गेटवे कॉन्फ़िगर नहीं है) — आपका कोड है {otp}",
      qrDescLong: "अपना ABHA QR कोड स्कैन करने के लिए कियोस्क कैमरे का उपयोग करें।",
      qrHint: "अपना ABHA QR कोड कैमरे के सामने रखें",
      qrUnrecognized: "उस QR कोड से ABHA नंबर नहीं पढ़ा जा सका। कृपया फिर से प्रयास करें या इसे मैन्युअल रूप से दर्ज करें।",
      qrManualFallback: "इसके बजाय ABHA आईडी मैन्युअल रूप से दर्ज करें",
      hospitalEntryTitle: "अपनी हॉस्पिटल आईडी दर्ज करें",
      hospitalEntrySubtitle: "यह वह आईडी है जो आपकी पिछली विज़िट के टोकन पर छपी थी।",
      hospitalInputLabel: "हॉस्पिटल आईडी",
      hospitalInputPlaceholder: "जैसे TKN-ABC123",
      hospitalIdRequired: "कृपया अपनी हॉस्पिटल आईडी दर्ज करें।",
      hospitalNotFound: "उस हॉस्पिटल आईडी के लिए कोई रिकॉर्ड नहीं मिला। कृपया जांच कर फिर से प्रयास करें, या नए मरीज़ के रूप में पंजीकरण करें।",
      lookupBtn: "खोजें", lookingUp: "खोजा जा रहा है...",
      welcomeBack: "वापसी पर स्वागत है, {name}! हमने नीचे आपकी जानकारी भर दी है — आगे बढ़ने से पहले कृपया इसे जांच लें।",
      abhaFieldLabel: "ABHA आईडी (वैकल्पिक)",
      abhaFieldPlaceholder: "यदि आपके पास है तो 14-अंकों का ABHA नंबर"
    },
    documentUpload: {
      title: "अपने पुराने रिकॉर्ड एक ही जगह लाएँ",
      subtitle: "क्या आपके पास कोई पुराना पर्चा या रिपोर्ट है?",
      scanCamera: "कैमरे से स्कैन करें", uploadDocument: "दस्तावेज़ अपलोड करें",
      uploadImage: "इमेज अपलोड करें", uploadPdf: "PDF अपलोड करें",
      whatType: "यह किस प्रकार का दस्तावेज़ है?",
      categories: { Prescription: "पर्चा", "Lab Report": "लैब रिपोर्ट", "Discharge Summary": "डिस्चार्ज सारांश", "Imaging Report": "इमेजिंग रिपोर्ट", "Surgery Record": "सर्जरी रिकॉर्ड", Other: "अन्य" },
      uploadSelected: "चुना गया दस्तावेज़ अपलोड करें", uploading: "अपलोड और निकाला जा रहा है…",
      continueReview: "समीक्षा हेतु आगे बढ़ें", skipNoDocuments: "छोड़ें — मेरे पास दस्तावेज़ नहीं हैं",
      uploadedSuccess: "सफलतापूर्वक अपलोड हुआ"
    },
    documentReview: {
      processingTitle: "हम आपके चिकित्सा रिकॉर्ड व्यवस्थित कर रहे हैं...",
      stages: ["दस्तावेज़ पढ़ा जा रहा है", "टेक्स्ट निकाला जा रहा है", "चिकित्सा जानकारी समझी जा रही है", "समयरेखा बनाई जा रही है", "सारांश तैयार किया जा रहा है"],
      noDocsTitle: "समीक्षा के लिए कोई दस्तावेज़ नहीं",
      noDocsDesc: "आपने कोई दस्तावेज़ अपलोड नहीं किया, इसलिए यहाँ पुष्टि करने के लिए कुछ नहीं है।",
      reviewInstructions: "कृपया हमारे द्वारा मिली जानकारी जांचें। आप किसी भी चीज़ की पुष्टि या सुधार कर सकते हैं।",
      noFields: "इस दस्तावेज़ से कोई जानकारी नहीं निकाली जा सकी।",
      confirmBtn: "पुष्टि करें", confirmedBtn: "पुष्टि हो गई", editBtn: "संपादित करें", saveBtn: "सेव करें",
      continueBtn: "आगे बढ़ें"
    },
    patientReview: {
      title: "आइए, आपने जो बताया उसकी समीक्षा करें",
      subtitleHi: "नमस्ते", subtitleRest: "डॉक्टर को भेजने से पहले कृपया इसे जांच लें।",
      loadingDetails: "आपकी जानकारी लोड हो रही है...",
      errorLoading: "अभी आपकी जानकारी लोड नहीं हो सकी। आप फिर भी सबमिट कर सकते हैं — आपके डॉक्टर आपसे सीधे सब कुछ पुष्टि करेंगे।",
      readyMsg: "सब कुछ आपके डॉक्टर के लिए तैयार है।",
      confirmSubmit: "पुष्टि करें और सबमिट करें",
      chiefComplaint: "मुख्य शिकायत", duration: "अवधि",
      documentsAdded: "जोड़े गए दस्तावेज़", ayushAssessment: "AYUSH मूल्यांकन",
      completed: "पूर्ण", notDone: "नहीं हुआ", notRecorded: "दर्ज नहीं"
    },
    patientComplete: {
      title: "सब हो गया!",
      message: "आपका चिकित्सा इतिहास दर्ज कर लिया गया है और सुरक्षित रूप से आपके डॉक्टर के साथ साझा किया गया है। कृपया प्रतीक्षा क्षेत्र में जाएँ।",
      encrypted: "आपका डेटा एन्क्रिप्टेड और सुरक्षित है।",
      finish: "समाप्त"
    },
    manageConsent: {
      title: "अपनी सहमति प्रबंधित करें",
      subtitle: "आप अपनी यात्रा के दौरान कभी भी अपनी सहमति की समीक्षा और बदलाव कर सकते हैं।",
      historyCapture: "क्लिनिकल इतिहास दर्ज करना", historyCaptureDesc: "इस कियोस्क के माध्यम से आपके लक्षण और चिकित्सा इतिहास दर्ज करना।",
      documentProcessing: "दस्तावेज़ प्रोसेसिंग", documentProcessingDesc: "आपके अपलोड किए गए पर्चों/रिपोर्ट्स से जानकारी स्कैन और निकालना।",
      sharing: "आपके डॉक्टर के साथ साझा करना", sharingDesc: "आपका दर्ज इतिहास और दस्तावेज़ आपके इलाज करने वाले डॉक्टर के साथ साझा करना।",
      revokedWarning: "पहले से इस्तेमाल हो चुकी सहमति (जैसे इतिहास दर्ज करना) वापस लेने का मतलब है कि हम आगे से वह गतिविधि रोक देंगे, लेकिन जो पहले ही दर्ज हो चुका है वह वापस नहीं होगा। आपके डॉक्टर को यह बदलाव सूचित कर दिया जाएगा।",
      saveChanges: "बदलाव सेव करें", savingBtn: "सेव हो रहा है...",
      updated: "आपकी सहमति अपडेट कर दी गई है।", continueBtn: "आगे बढ़ें"
    },
    ayushAssessment: {
      title: "AYUSH क्लिनिकल मूल्यांकन",
      subtitle: "यह मूल्यांकन AYUSH क्लिनिकल प्रैक्टिस में उपयोग होने वाली अतिरिक्त जानकारी दर्ज करता है।",
      progress: "मूल्यांकन प्रगति",
      listen: "सुनें", speak: "बोलें", listening: "सुन रहा है…"
    },
    patientIntake: {
      sidebarHeading: "चिकित्सा इतिहास",
      ayushSidebarItem: "आयुष मूल्यांकन",
      aiLabel: "मेडीकियोस्क AI",
      patientFallback: "मरीज़",
      listenAria: "प्रश्न सुनें",
      speakAria: "अपना जवाब बोलें",
      listening: "सुन रहा है...",
      voiceHintSupported: "आप बोलकर या टैप करके जवाब दे सकते हैं।",
      voiceHintUnsupported: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है — कृपया टैप करके जवाब दें।",
      voiceNoMatch: "\"{heard}\" सुना — किसी विकल्प से मेल नहीं खाया। कृपया फिर से कोशिश करें या टैप करें।",
      priorityAlertTitle: "🚨 प्राथमिकता चेतावनी",
      priorityAlertBody: "आपने जो लक्षण बताए हैं उनके लिए तुरंत चिकित्सा जांच की आवश्यकता हो सकती है।",
      priorityAlertNote: "कृपया स्वास्थ्यकर्मी की प्रतीक्षा करें। स्टाफ को सूचित कर दिया गया है।",
      alertTriageBtn: "ट्रायज स्टाफ को सूचित करें",
      continueAssistedBtn: "केवल सहायता प्राप्त मोड में आगे बढ़ें"
    }
  }
};

export default translations;

// FIX: exposes which languages actually have a full text translation, so
// LanguageSelect.jsx can be honest in the UI instead of silently falling
// back to English for Bengali/Marathi/Tamil/Telugu/Kannada/Gujarati.
export const SUPPORTED_TRANSLATION_LANGUAGES = Object.keys(translations); // currently ["English", "Hindi"]

export function getTranslation(language) {
  if (!translations[language]) {
    // Not silent anymore — shows up in the console instead of just
    // quietly rendering English text under a different language's flag.
    console.warn(`No translation found for "${language}" — falling back to English.`);
  }
  return translations[language] || translations.English;
}