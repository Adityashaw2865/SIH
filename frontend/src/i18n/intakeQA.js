// Hindi translations for the dynamic clinical intake questions/options used
// in PatientIntake.jsx (chest pain / fever / stomach pain / headache /
// breathlessness / weakness / injury / generic flows).
//
// IMPORTANT — how this is used:
// The flow data in PatientIntake.jsx (question text, option strings, section
// names) stays in English — that's the CANONICAL value. It's what actually
// gets sent to the backend, stored on the patient record, matched against
// the red-flag rules, and shown on the (English-only) doctor/triage
// dashboards. These dictionaries are used ONLY to look up what to *display*
// or *speak* to the patient when their selected language is Hindi — the
// underlying English value passed to answer() never changes. This keeps the
// red-flag detection and adaptive flow logic language-agnostic and safe.
//
// Clinical review note: this is a functional, patient-understandable
// translation of the intake questions — not yet reviewed by a clinician for
// precise medical terminology. Recommended before a real hospital deployment.

export const QUESTION_HI = {
    "What problem brought you to the hospital today?": "आज आपको अस्पताल किस समस्या के कारण आना पड़ा?",
  
    // Chest pain
    "When did the pain start?": "दर्द कब शुरू हुआ?",
    "Did the pain come on suddenly or gradually?": "क्या दर्द अचानक शुरू हुआ या धीरे-धीरे?",
    "Do you also have breathlessness?": "क्या आपको सांस लेने में भी तकलीफ है?",
    "Are you sweating more than usual right now?": "क्या अभी आपको सामान्य से ज़्यादा पसीना आ रहा है?",
    "Do you feel dizzy or light-headed?": "क्या आपको चक्कर या सिर हल्का महसूस हो रहा है?",
    "Have you had any heart problems before?": "क्या आपको पहले कभी दिल की कोई समस्या रही है?",
    "Are you currently taking any medicines?": "क्या आप फिलहाल कोई दवा ले रहे हैं?",
    "Do you have any known allergies?": "क्या आपको कोई ज्ञात एलर्जी है?",
    "Anything else you'd like to mention?": "क्या आप कुछ और बताना चाहेंगे?",
  
    // Fever
    "How long have you had the fever?": "आपको बुखार कब से है?",
    "How high is the temperature?": "तापमान कितना ज़्यादा है?",
    "Do you have neck stiffness?": "क्या आपकी गर्दन अकड़ी हुई है?",
    "Are you confused or unusually drowsy?": "क्या आप भ्रमित हैं या असामान्य रूप से नींद महसूस कर रहे हैं?",
    "Do you have any new skin rash?": "क्या आपकी त्वचा पर कोई नया चकत्ता है?",
    "Any chills, cough, or body aches along with the fever?": "बुखार के साथ ठंड लगना, खांसी, या बदन दर्द भी है?",
    "Have you had any recent travel or contact with a sick person?": "क्या आपने हाल ही में यात्रा की है या किसी बीमार व्यक्ति के संपर्क में आए हैं?",
  
    // Stomach pain
    "Where is the pain located?": "दर्द कहाँ हो रहा है?",
    "Is the pain rigid / board-like, or worse with movement?": "क्या दर्द सख्त/तख्ते जैसा है, या हिलने-डुलने से बढ़ता है?",
    "Have you vomited blood or passed black/tarry stool?": "क्या आपने खून की उल्टी की है या काला/चिपचिपा मल त्यागा है?",
    "Have you fainted or felt like losing consciousness?": "क्या आप बेहोश हुए हैं या बेहोशी जैसा महसूस हुआ?",
    "Any nausea, vomiting, or fever with the pain?": "दर्द के साथ जी मिचलाना, उल्टी, या बुखार भी है?",
    "Have you had any stomach or abdominal surgery before?": "क्या आपकी पहले पेट की कोई सर्जरी हुई है?",
  
    // Headache
    "When did the headache start?": "सिरदर्द कब शुरू हुआ?",
    "Is this the sudden, worst headache of your life?": "क्या यह आपकी ज़िंदगी का सबसे भयंकर और अचानक हुआ सिरदर्द है?",
    "Any weakness or numbness on one side of the body?": "क्या शरीर के एक तरफ कमज़ोरी या सुन्नपन है?",
    "Any slurred speech or trouble speaking?": "क्या बोलने में लड़खड़ाहट या दिक्कत है?",
    "Any vision loss, blurred, or double vision?": "क्या नज़र कमज़ोर, धुंधली, या दोहरी दिख रही है?",
    "What makes the headache worse?": "किस चीज़ से सिरदर्द बढ़ता है?",
    "Have you had migraines or headaches like this before?": "क्या आपको पहले भी माइग्रेन या ऐसा सिरदर्द हुआ है?",
  
    // Breathlessness
    "When did the breathlessness start?": "सांस लेने में तकलीफ कब शुरू हुई?",
    "Can you speak in full sentences without stopping to catch your breath?": "क्या आप बिना सांस के लिए रुके पूरा वाक्य बोल सकते हैं?",
    "Are your lips or fingertips looking blue or grey?": "क्या आपके होंठ या उंगलियों के सिरे नीले या भूरे दिख रहे हैं?",
    "Is the breathlessness there even while sitting still (at rest)?": "क्या शांत बैठे रहने पर भी सांस की तकलीफ है?",
    "Any chest pain or chest tightness along with the breathlessness?": "सांस की तकलीफ के साथ सीने में दर्द या जकड़न भी है?",
    "Any wheezing or noisy breathing?": "क्या सांस लेते समय सीटी जैसी आवाज़ आती है?",
    "Do you have asthma, COPD, or any heart condition?": "क्या आपको अस्थमा, COPD, या दिल की कोई बीमारी है?",
    "Are you currently taking any medicines (e.g. an inhaler)?": "क्या आप फिलहाल कोई दवा ले रहे हैं (जैसे इनहेलर)?",
  
    // Weakness
    "When did the weakness start?": "कमज़ोरी कब शुरू हुई?",
    "Is the weakness on one side of the body (face, arm, or leg)?": "क्या कमज़ोरी शरीर के एक तरफ (चेहरा, हाथ, या पैर) है?",
    "Any drooping or numbness on one side of the face?": "क्या चेहरे के एक तरफ लटकाव या सुन्नपन है?",
    "Any slurred speech or difficulty finding words?": "क्या बोलने में लड़खड़ाहट या शब्द ढूँढने में दिक्कत है?",
    "Any sudden vision changes or trouble seeing?": "क्या अचानक नज़र में बदलाव या देखने में दिक्कत हुई?",
    "Any loss of balance or trouble walking?": "क्या संतुलन बिगड़ा है या चलने में दिक्कत है?",
    "Do you have high blood pressure, diabetes, or a previous stroke?": "क्या आपको हाई ब्लड प्रेशर, डायबिटीज़, या पहले कभी स्ट्रोक हुआ है?",
    "Are you currently taking any medicines (e.g. blood thinners)?": "क्या आप फिलहाल कोई दवा ले रहे हैं (जैसे खून पतला करने वाली)?",
  
    // Injury / bleeding
    "When did the injury happen?": "चोट कब लगी?",
    "Is there heavy or ongoing bleeding that won't stop?": "क्या भारी या लगातार खून बह रहा है जो रुक नहीं रहा?",
    "Did you lose consciousness (pass out) after the injury?": "क्या चोट लगने के बाद आप बेहोश हो गए थे?",
    "Is there an obvious deformity (bone out of place, joint looks wrong)?": "क्या कोई साफ विकृति दिख रही है (हड्डी अपनी जगह से हटी हुई, जोड़ टेढ़ा दिख रहा)?",
    "How did the injury happen?": "चोट कैसे लगी?",
    "Are you on any blood-thinning medicines?": "क्या आप खून पतला करने वाली कोई दवा ले रहे हैं?",
  
    // Generic
    "How long have you had this problem?": "यह समस्या आपको कब से है?",
    "How severe is it?": "यह कितनी गंभीर है?",
    "What makes it worse?": "किस चीज़ से यह बढ़ती है?",
    "Do you have any long-term illnesses (diabetes, BP, etc.)?": "क्या आपको कोई दीर्घकालिक बीमारी है (डायबिटीज़, बीपी, आदि)?",
    "Any major illnesses that run in your family?": "क्या आपके परिवार में कोई बड़ी बीमारी चलती है?",
    "Do you smoke or drink alcohol?": "क्या आप धूम्रपान या शराब का सेवन करते हैं?"
  };
  
  export const OPTION_HI = {
    // Chief complaint
    "Chest pain": "सीने में दर्द",
    "Breathlessness": "सांस लेने में तकलीफ",
    "Stomach pain": "पेट में दर्द",
    "Fever": "बुखार",
    "Headache": "सिरदर्द",
    "Weakness / one-sided body weakness": "कमज़ोरी / शरीर के एक तरफ कमज़ोरी",
    "Injury / bleeding": "चोट / खून बहना",
    "Knee / joint pain": "घुटने / जोड़ों में दर्द",
    "Something else": "कुछ और",
  
    // Duration buckets (shared across flows)
    "Just now": "अभी-अभी",
    "Today": "आज",
    "1–7 days ago": "1–7 दिन पहले",
    "1–4 weeks ago": "1–4 हफ्ते पहले",
    "More than a month ago": "एक महीने से ज़्यादा पहले",
    "Within the last hour": "पिछले एक घंटे में",
    "More than a week ago": "एक हफ्ते से ज़्यादा पहले",
    "1–2 days ago": "1–2 दिन पहले",
    "More than 2 days ago": "2 दिन से ज़्यादा पहले",
    "1–3 days": "1–3 दिन",
    "4–7 days": "4–7 दिन",
    "More than a week": "एक हफ्ते से ज़्यादा",
    "1–7 days": "1–7 दिन",
    "1–4 weeks": "1–4 हफ्ते",
    "1–6 months": "1–6 महीने",
    "More than 6 months": "6 महीने से ज़्यादा",
  
    // Common yes/no/etc.
    "Suddenly": "अचानक",
    "Gradually": "धीरे-धीरे",
    "Yes": "हाँ",
    "No": "नहीं",
    "Not sure": "पक्का नहीं",
    "No known allergies": "कोई ज्ञात एलर्जी नहीं",
    "No, that's all": "नहीं, बस इतना ही",
    "Yes, one more thing": "हाँ, एक और बात है",
  
    // Fever severity
    "Mild (below 100°F)": "हल्का (100°F से कम)",
    "Moderate (100–103°F)": "मध्यम (100–103°F)",
    "Above 103°F / 39.4°C": "103°F / 39.4°C से ज़्यादा",
    "Not measured": "नापा नहीं गया",
  
    // Fever accompanying symptoms
    "Chills": "ठंड लगना",
    "Cough": "खांसी",
    "Body aches": "बदन दर्द",
    "None of these": "इनमें से कोई नहीं",
  
    // Stomach pain location
    "Upper abdomen": "पेट का ऊपरी हिस्सा",
    "Lower abdomen": "पेट का निचला हिस्सा",
    "Right side": "दाईं तरफ",
    "Left side": "बाईं तरफ",
    "All over": "पूरे पेट में",
  
    "Nausea": "जी मिचलाना",
    "Vomiting": "उल्टी",
  
    // Headache aggravating factors
    "Light": "रोशनी",
    "Noise": "आवाज़",
    "Movement": "हिलने-डुलने से",
  
    // Injury cause
    "Fall": "गिरना",
    "Road accident": "सड़क दुर्घटना",
    "Sports injury": "खेल के दौरान चोट",
    "Sharp object / cut": "नुकीली चीज़ / कट लगना",
    "Other": "अन्य",
  
    // Generic severity
    "Mild": "हल्का",
    "Moderate": "मध्यम",
    "Severe": "गंभीर",
  
    // Generic aggravating factors
    "Rest": "आराम करने से",
    "Eating": "खाने से",
  
    // Personal history
    "Neither": "दोनों में से कोई नहीं",
    "Smoke": "धूम्रपान",
    "Drink": "शराब",
    "Both": "दोनों"
  };
  
  export const SECTION_HI = {
    "Basic Information": "बुनियादी जानकारी",
    "Chief Complaint": "मुख्य शिकायत",
    "History of Present Illness": "वर्तमान बीमारी का इतिहास",
    "Past History": "पुराना इतिहास",
    "Medication": "दवाएं",
    "Allergies": "एलर्जी",
    "Family History": "पारिवारिक इतिहास",
    "Personal History": "व्यक्तिगत इतिहास",
    "Review of Systems": "सिस्टम समीक्षा"
  };
  
  // Native display name for each language, used to show the language pill in
  // the patient's own script (e.g. "हिंदी" instead of "Hindi") rather than
  // always in English.
  export const LANG_NATIVE_NAME = {
    Hindi: "हिंदी",
    English: "English",
    Bengali: "বাংলা",
    Marathi: "मराठी",
    Tamil: "தமிழ்",
    Telugu: "తెలుగు",
    Kannada: "ಕನ್ನಡ",
    Gujarati: "ગુજરાતી"
  };