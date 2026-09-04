import "dotenv/config";
import { connectDB } from "../db/connection.js";
import { Staff } from "../models/Staff.js";

async function main() {
  await connectDB();
  const result = await Staff.deleteMany({ username: { $regex: /\.\./ } });
  console.log(`Deleted ${result.deletedCount} malformed staff accounts.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});