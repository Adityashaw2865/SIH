import { Router } from "express";
import { Kiosk } from "../models/Kiosk.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const kiosksRouter = Router();

// A kiosk counts as "online" if it has pinged /heartbeat in the last 2 minutes.
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

function serializeKiosk(kiosk) {
  const obj = kiosk.toObject();
  obj.id = kiosk._id.toString();
  const isOnline = obj.lastSeenAt && (Date.now() - new Date(obj.lastSeenAt).getTime()) < ONLINE_THRESHOLD_MS;
  obj.status = isOnline ? "online" : "offline";
  return obj;
}

// Staff-only: list all registered kiosks
kiosksRouter.get("/", requireAuth, requireRole("triage", "doctor"), async (_req, res, next) => {
  try {
    const kiosks = await Kiosk.find().sort({ createdAt: -1 });
    res.json({ success: true, data: kiosks.map(serializeKiosk) });
  } catch (err) { next(err); }
});

// Staff-only: register a new kiosk
kiosksRouter.post("/", requireAuth, requireRole("triage"), async (req, res, next) => {
  try {
    const { kioskId, location, languages } = req.body;
    if (!kioskId || !location) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "kioskId and location are required" }
      });
    }
    const kiosk = await Kiosk.create({
      kioskId,
      location,
      languages: Array.isArray(languages) && languages.length ? languages : ["English"]
    });
    res.status(201).json({ success: true, data: serializeKiosk(kiosk) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: "DUPLICATE", message: "A kiosk with this ID already exists" }
      });
    }
    next(err);
  }
});

// Staff-only: remove a kiosk
kiosksRouter.delete("/:id", requireAuth, requireRole("triage"), async (req, res, next) => {
  try {
    const kiosk = await Kiosk.findByIdAndDelete(req.params.id);
    if (!kiosk) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Kiosk not found" } });
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) { next(err); }
});

// Public: called periodically by the actual kiosk device/browser tab to
// mark itself as online. No auth — the kiosk itself isn't a logged-in staff
// user, it identifies itself only by its own kioskId.
kiosksRouter.post("/:kioskId/heartbeat", async (req, res, next) => {
  try {
    const kiosk = await Kiosk.findOneAndUpdate(
      { kioskId: req.params.kioskId },
      { $set: { lastSeenAt: new Date() } },
      { new: true }
    );
    if (!kiosk) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Unknown kiosk ID" } });
    res.json({ success: true, data: serializeKiosk(kiosk) });
  } catch (err) { next(err); }
});