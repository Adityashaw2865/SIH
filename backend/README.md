# MediKiosk Backend (MERN — Node.js + Express + MongoDB)

A real backend for the MediKiosk prototype, using MongoDB Atlas.

## What's actually real here

| Feature | Status |
|---|---|
| Patient records, answers, documents, red flags, AYUSH, audit log | ✅ Real — Mongoose schema, persisted in MongoDB |
| OCR (image → text) | ✅ Real — Tesseract.js, actually reads the image (tested and verified during development) |
| Medical entity extraction | ⚠️ Real IF `ANTHROPIC_API_KEY` is set (calls Claude for structured extraction). Otherwise falls back to a transparent regex-based extractor. |
| FHIR resource generation | ✅ Real — valid FHIR R4 `Patient`, `Condition`, `MedicationStatement`, `Bundle` JSON built from actual patient data |
| ABDM / ABHA integration | ⚠️ Real IF `ABDM_CLIENT_ID` + `ABDM_CLIENT_SECRET` are set — calls the actual ABDM Gateway sandbox/prod API (`src/services/abdmGatewayService.js`). Otherwise falls back to a local OTP simulation so the flow still works without NHA credentials. |
| Indian-language ASR (Bhashini) | ⚠️ Real IF `BHASHINI_USER_ID` + `BHASHINI_API_KEY` are set — calls the actual government Bhashini/AI4Bharat pipeline (`src/services/bhashiniService.js`). Otherwise falls back to a local, offline Whisper model (`@xenova/transformers`, no key needed) — real transcription either way. |

**Important honesty note:** this code was developed and type-checked in a sandbox that
cannot reach `*.mongodb.net`, so the MongoDB connection itself could not be
live-tested here. The OCR → extraction → FHIR pipeline *was* fully tested end-to-end
against a SQLite version with identical business logic before this migration —
the Mongoose queries follow standard, well-documented patterns, but please run
`npm run dev` and confirm the `/api/health` and a test patient-creation call work
against your own Atlas cluster before relying on it.

## Setup

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Get your connection string (Database → Connect → Drivers)
3. ```bash
   npm install
   cp .env.example .env
   # paste your MONGODB_URI into .env
   npm run dev