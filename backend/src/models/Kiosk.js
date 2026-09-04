import mongoose, { Schema } from "mongoose";

// Represents a physical kiosk device deployed at a hospital location.
// "status" is derived from lastSeenAt (see routes/kiosks.js) rather than
// stored directly — a kiosk is only "online" if it has checked in recently.
const KioskSchema = new Schema({
  kioskId: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  languages: {
    type: [String],
    default: ["English"]
  },
  lastSeenAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export const Kiosk = mongoose.model("Kiosk", KioskSchema);