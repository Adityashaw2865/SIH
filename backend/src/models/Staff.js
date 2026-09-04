import mongoose, { Schema } from "mongoose";

const StaffSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    // "admin" added so routes/patients.js's
    // requireRole("triage", "doctor", "admin") on GET /analytics can
    // actually be satisfied — previously no account could ever have
    // this role, so AdminDashboard.jsx always got a 403 for admins.
    type: String,
    enum: ["triage", "doctor", "admin"],
    required: true
  },
  doctorName: {
    type: String,
    default: null
  },
  // Only meaningful when role === "doctor". Drives the Triage Dashboard's
  // assign-dropdown grouping and the chief-complaint -> department
  // auto-suggestion (see data/doctors.js). Left null for triage accounts.
  department: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const Staff = mongoose.model("Staff", StaffSchema);