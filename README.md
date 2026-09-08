# MediKiosk — AI-Powered Clinical History Software Platform

**Smart India Hackathon 2026 — Problem Statement ID: 26047**
**Title:** Patient Case-Taking Software
**Organization:** Ministry of Ayush — All India Institute of Ayurveda
**Category:** Software | **Theme:** MedTech / BioTech / HealthTech

🔗 **Live Demo:** [sih-psi-virid.vercel.app](https://sih-psi-virid.vercel.app)

---

## 📋 Problem Statement

Indian hospital OPDs handle 4,000–10,000+ patients a day, with doctor-to-patient
consultation time often just 2–5 minutes. In that window, physicians must elicit a
full clinical history, examine the patient, review prior records, diagnose, counsel,
and prescribe — leading to under-elicitation of history, missed comorbidities, and
diagnostic error. AYUSH institutions face an even heavier burden, needing detailed
Ashtavidha/Dashavidha Pariksha assessments that are practically impossible to capture
in a standard OPD slot.

**MediKiosk** solves this by letting patients complete a structured, AI-guided
clinical history — by voice or touch, in their own language — and digitize their
existing prescriptions/reports, *before* they ever enter the consultation room. The
physician opens the consultation to a ready, structured, editable summary instead of
starting from zero.

---

## ✨ Features

### 🗣️ Conversational Multimodal History Engine
- Adaptive voice + touch interview — every question answerable either way
- SOCRATES-style follow-up questioning for symptom characterization
- AYUSH mode: Dashavidha Pariksha (Prakriti, Vikriti, Sara, Satmya, Sattva, etc.) and Ahara-Vihara capture
- Automatic **red-flag detection** (e.g. chest pain + breathlessness, stroke signs) with instant priority escalation to triage

### 📄 Medical Document Digitization
- OCR on uploaded prescriptions, lab reports, and discharge summaries (printed + handwritten)
- Structured extraction of diagnoses, medications, dosages, and investigation values
- Chronological timeline of a patient's document history
- Magic-byte file validation (rejects spoofed/mismatched file types before OCR runs)

### 🧾 Structured Summary Generator
- Synthesizes conversation + documents into one physician-ready summary
- Standard format: Chief Complaint → HPI → Past History → Drug/Allergy → Family → Personal → ROS → Investigations
- Fully editable by the physician before being saved — never an autonomous diagnosis

### 🔐 Consent, Privacy & ABDM Integration
- ABHA-number-based patient login (real ABDM Gateway integration, with OTP simulation fallback for local/demo use)
- Granular, revocable consent (history capture / document processing / provider sharing)
- Real FHIR R4 resource generation (`Patient`, `Condition`, `MedicationStatement`, `Bundle`)
- JWT-based staff authentication with role-based access (triage / doctor / admin)
- Rate limiting, security headers (Helmet), and audit logging throughout

### 🌐 Multilingual Voice Support
- Indian-language ASR via Bhashini/AI4Bharat (real integration, with offline Whisper fallback)
- Bilingual output: patient-facing audio in local language, physician summary in English/Hindi

### 📊 Dashboards
- **Triage Dashboard** — live patient queue, red-flag alerts, doctor assignment
- **Doctor Dashboard** — structured summaries, document review, FHIR export
- **Admin Dashboard** — real-time analytics (patients today, completion rate, language distribution, case trends)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Atlas) via Mongoose |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| OCR | Tesseract.js |
| Speech-to-Text | Bhashini/AI4Bharat (real) → Whisper via `@xenova/transformers` (offline fallback) |
| Clinical Extraction | Anthropic Claude API (real) → regex-based fallback |
| Health Interop | ABDM Gateway (real) → local OTP simulation (fallback), FHIR R4 |
| Security | Helmet, `express-rate-limit`, `file-type` magic-byte validation, `zod` |

---

## 📁 Project Structure

```
SIH/
├── backend/
│   ├── src/
│   │   ├── index.js              # App entry point
│   │   ├── db/                   # MongoDB connection
│   │   ├── middleware/           # auth.js, rateLimit.js
│   │   ├── models/               # Patient, Staff schemas
│   │   ├── routes/               # auth, patients, documents, speech, summary, kiosks
│   │   ├── services/             # OCR, extraction, ABDM gateway, Bhashini, speech, PDF
│   │   ├── scripts/               # seed scripts
│   │   └── data/                 # static doctor roster / suggestion data
│   ├── tessdata/                 # OCR language files
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── patient/           # Kiosk flow: register, consent, intake, AYUSH, documents
    │   │   ├── triage/            # Triage dashboard
    │   │   ├── doctor/            # Doctor dashboard
    │   │   ├── Landing.jsx
    │   │   └── Login.jsx
    │   ├── components/
    │   ├── hooks/
    │   ├── services/              # API client
    │   ├── context/
    │   └── i18n/                  # Multilingual UI strings
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Clone the repo
```bash
git clone https://github.com/Adityashaw2865/SIH.git
cd SIH
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in .env — at minimum: MONGODB_URI, JWT_SECRET
npm run dev
```
Confirm it's running:
```bash
curl http://localhost:4000/api/health
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

### 4. First-time admin account (local/demo only)
Set `ALLOW_SEED_ADMIN=true` in `backend/.env`, then:
```bash
curl -X POST http://localhost:4000/api/auth/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'
```
Remove/unset `ALLOW_SEED_ADMIN` again afterwards.

---

## 🔑 Environment Variables

See `backend/.env.example` for the full list. Key ones:

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | Database connection |
| `JWT_SECRET` | ✅ | Signs staff login tokens |
| `FRONTEND_URL` | Recommended | CORS origin |
| `ABDM_CLIENT_ID` / `ABDM_CLIENT_SECRET` | Optional | Enables real ABDM Gateway (else OTP simulation) |
| `BHASHINI_USER_ID` / `BHASHINI_API_KEY` | Optional | Enables real Bhashini ASR (else offline Whisper) |
| `ANTHROPIC_API_KEY` | Optional | Enables AI-based clinical entity extraction (else regex fallback) |
| `ALLOW_SEED_ADMIN` | Local/demo only | Enables the one-time admin-seeding route |

---

## 🛡️ Security Notes

- Staff routes are protected by JWT + role-based access; patient-facing kiosk routes are intentionally public (patients don't log in).
- Rate limiting is applied on login, admin-seeding, file upload, and speech transcription endpoints, plus a global API baseline.
- Uploaded files are validated by both declared MIME type and actual file-byte signature.
- No file virus scanning yet — recommended before any production deployment.

See `backend/README.md` for full backend-specific documentation.

---

## 👤 Team

| Name | Role |
|---|---|
| Aditya Kumar S. (Adityashaw2865) | Developer |

---

## 📄 License

This project was built for Smart India Hackathon 2026 (Problem Statement 26047, Ministry of Ayush).
