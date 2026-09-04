import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Staff } from "../models/Staff.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const authRouter = Router();

// Login — returns a JWT valid for 12 hours
authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "username and password are required" }
      });
    }
    const staff = await Staff.findOne({ username: username.toLowerCase().trim() });
    if (!staff) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" }
      });
    }
    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" }
      });
    }
    const token = jwt.sign(
      {
        id: staff._id.toString(),
        username: staff.username,
        role: staff.role,
        doctorName: staff.doctorName
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.json({
      success: true,
      data: {
        token,
        user: {
          username: staff.username,
          role: staff.role,
          doctorName: staff.doctorName
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// One-time seed route to create the first triage account — only works if NO staff exist yet.
// NOTE: for seeding all three roles (admin/triage/doctor) at once for local
// development/demo, use `node src/scripts/seedDemoData.js` instead — it's
// idempotent (safe to re-run) and doesn't have the "only if zero staff
// exist" restriction this route has.
authRouter.post("/seed-admin", async (req, res, next) => {
  try {
    const existing = await Staff.countDocuments();
    if (existing > 0) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Staff already exist. Use /login instead." }
      });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "username and password are required" }
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await Staff.create({ username: username.toLowerCase().trim(), passwordHash, role: "triage" });
    res.status(201).json({
      success: true,
      data: { username: staff.username, role: staff.role }
    });
  } catch (err) {
    next(err);
  }
});

// Creates new staff accounts (triage / doctor / admin) — triage and admin only.
authRouter.post("/staff", requireAuth, requireRole("triage", "admin"), async (req, res, next) => {
  try {
    const { username, password, role, doctorName, department } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "username, password and role are required" }
      });
    }
    if (!["triage", "doctor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "role must be triage, doctor, or admin" }
      });
    }
    // Doctor accounts need a display name + department — without these the
    // Triage Dashboard's assign-dropdown can't show or auto-suggest them
    // (see GET /api/patients/doctors).
    if (role === "doctor" && (!doctorName || !department)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "doctorName and department are required for doctor accounts" }
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await Staff.create({
      username: username.toLowerCase().trim(),
      passwordHash,
      role,
      doctorName: role === "doctor" ? doctorName : null,
      department: role === "doctor" ? department : null
    });
    res.status(201).json({
      success: true,
      data: { username: staff.username, role: staff.role, doctorName: staff.doctorName, department: staff.department }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: "DUPLICATE", message: "Username already exists" }
      });
    }
    next(err);
  }
});

// List all staff — triage and admin only (for a staff list, no passwords returned)
authRouter.get("/staff", requireAuth, requireRole("triage", "admin"), async (_req, res, next) => {
  try {
    const staff = await Staff.find().select("username role doctorName department createdAt");
    res.json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
});