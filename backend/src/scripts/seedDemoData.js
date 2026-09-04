import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../db/connection.js";
import { Staff } from "../models/Staff.js";

/**
 * Seeds one demo account for each role (triage / doctor) for
 * local development and demos — so you don't have to manually call
 * /api/auth/seed-admin + /api/auth/staff every time you reset the DB.
 *
 * Idempotent: safe to re-run. If an account with a given username
 * already exists, it's left untouched (password is NOT reset) rather
 * than erroring out or duplicating.
 *
 * Usage:
 *   cd backend
 *   node src/scripts/seedDemoData.js
 *
 * Change the DEMO_ACCOUNTS list below if you want different usernames/
 * passwords — these are meant for local dev only, not production.
 */

const DEMO_ACCOUNTS = [
  {
    username: "triage",
    password: "triage123",
    role: "triage"
  },
  {
    username: "doctor",
    password: "doctor123",
    role: "doctor",
    doctorName: "Dr. Aditi Sharma",
    department: "General Medicine"
  }
];

async function main() {
  await connectDB();

  for (const account of DEMO_ACCOUNTS) {
    const existing = await Staff.findOne({ username: account.username });
    if (existing) {
      console.log(`⏭  Skipped "${account.username}" — already exists (role: ${existing.role}).`);
      continue;
    }
    const passwordHash = await bcrypt.hash(account.password, 10);
    await Staff.create({
      username: account.username,
      passwordHash,
      role: account.role,
      doctorName: account.doctorName || null,
      department: account.department || null
    });
    console.log(`✅ Created "${account.username}" (role: ${account.role}, password: ${account.password})`);
  }

  console.log("\nDone. Demo login credentials:");
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.role.padEnd(7)} → username: ${account.username}  password: ${account.password}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});