import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db/connection.js";
import { patientsRouter } from "./routes/patients.js";
import { documentsRouter } from "./routes/documents.js";
import { summaryRouter } from "./routes/summary.js";
import { speechRouter } from "./routes/speech.js";
import { authRouter } from "./routes/auth.js";
import { kiosksRouter } from "./routes/kiosks.js";
import { requireAuth } from "./middleware/auth.js";

// Safety net: Tesseract.js can, on malformed/unsupported files, emit an
// internal worker-thread error that Node treats as fatal (crashing the
// whole process) even though we already guard against it in
// ocrService.js. This keeps the server alive for all other patients if
// that guard is ever bypassed, instead of taking the whole kiosk down.
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server kept alive):", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection (server kept alive):", err);
});

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      time: new Date().toISOString()
    }
  });
});

app.use("/api/auth", authRouter);

// Patient-facing kiosk flow (registration, consent, intake, ayush, docs)
// stays PUBLIC — patients don't log in, they use the kiosk directly.
app.use("/api/patients", patientsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/speech", speechRouter);
app.use("/api/kiosks", kiosksRouter);

// Summary/FHIR export is staff-only — protect it
app.use("/api/summary", requireAuth, summaryRouter);

// Never expose stack traces to clients (per safety spec)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again."
    }
  });
});

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`MediKiosk backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to MongoDB:", err.message);
  process.exit(1);
});