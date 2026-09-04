# MediKiosk Backend (MERN — Node.js + Express + MongoDB)

A real backend for the MediKiosk prototype, using MongoDB Atlas.

## What's actually real here

| Feature | Status |
|---|---|
| Patient records, answers, documents, red flags, AYUSH, audit log | ✅ Real — Mongoose schema, persisted in MongoDB |
| OCR (image → text) | ✅ Real — Tesseract.js, actually reads the image (tested and verified during development) |
| Medical entity extraction | ⚠️ Real IF `ANTHROPIC_API_KEY` is set (calls Claude for structured extraction). Otherwise falls back to a transparent regex-based extractor. |
| FHIR resource generation | ✅ Real — valid FHIR R4 `Patient`, `Condition`, `MedicationStatement`, `Bundle` JSON built from actual patient data |
| ABDM / ABHA integration | ❌ Mocked — no real government sandbox credentials available. The `abha` field is stored but not verified against ABDM. |
| Indian-language ASR (Bhashini) | ❌ Not implemented — paid/gov API, outside what could be built here. Frontend simulates voice input. |

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
   ```
4. Confirm it's working:
   ```bash
   curl http://localhost:4000/api/health
   ```

### Tesseract language data

`tessdata/eng.traineddata.gz` and `tessdata/hin.traineddata.gz` are included.
Add more from https://github.com/naptha/tessdata into `tessdata/`.

## API Overview

- `POST /api/patients` — create a patient
- `GET /api/patients` — list patients (for dashboards)
- `GET /api/patients/:id` — full patient record
- `POST /api/patients/:id/consent` — set consent flags
- `POST /api/patients/:id/answers` — record one intake answer
- `POST /api/patients/:id/ayush` — save AYUSH assessment
- `POST /api/patients/:id/red-flags` — raise a red flag (sets priority to critical)
- `POST /api/patients/:id/red-flags/:flagId/acknowledge` — triage acknowledges
- `POST /api/patients/:id/complete` — mark intake complete
- `POST /api/patients/:id/verify` — doctor verifies the record
- `POST /api/documents/:patientId/upload` — upload a document (multipart `file` field); runs real OCR + extraction, embeds result in the patient document
- `PATCH /api/documents/:patientId/:documentId/fields/:fieldId` — confirm/edit an extracted field
- `POST /api/summary/:patientId/generate` — build structured summary from recorded answers
- `PATCH /api/summary/:patientId` — doctor edits a summary field (audit-logged)
- `GET /api/summary/:patientId/fhir` — export a real FHIR R4 Bundle

## Data model

Each patient is a single MongoDB document (not spread across tables) — this
fits Mongoose/MongoDB's document model naturally: answers, red flags,
documents (with embedded extracted fields), AYUSH profile, and audit log
all live as arrays/subdocuments inside the `Patient` document. See
`src/models/Patient.ts`.

## Known limitations

- No authentication/authorization yet — every endpoint is open. Add JWT-based auth (e.g. `jsonwebtoken` + role middleware) before any real deployment.
- The rule-based extraction fallback is intentionally simple (regex on `Label: value` lines) — real handwriting needs the Claude-based path.
- No rate limiting, request validation middleware (zod is installed but not yet wired into every route), or file virus scanning — add these before production use.
