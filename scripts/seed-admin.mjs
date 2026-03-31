/**
 * Seeds or updates the single AdminSetting document for admin panel login.
 *
 * Usage (from project root):
 *   node scripts/seed-admin.mjs
 *
 * Optional .env overrides:
 *   SEED_ADMIN_EMAIL=you@example.com
 *   SEED_ADMIN_PASSWORD=YourStrongPass123
 *
 * Requires: MONGODB_URI in .env
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const envPath = resolve(__dirname, "../.env");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch (e) {
    console.warn("Could not read .env:", e.message);
  }
}

loadDotEnv();

const AdminSettingSchema = new mongoose.Schema(
  {
    siteAdminName: { type: String, default: "Admin User" },
    siteAdminEmail: { type: String, default: "admin@example.com" },
    passwordHash: { type: String, required: true },
    twoFA: { type: Boolean, default: false },
    siteName: { type: String, default: "My Store" },
    currency: { type: String, default: "INR" },
    maintenance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AdminSetting =
  mongoose.models.AdminSetting ||
  mongoose.model("AdminSetting", AdminSettingSchema);

/** Use a normal domain so <input type="email"> in browsers accepts it (.local is often rejected). */
const DEFAULT_EMAIL = "admin@rtrading.com";
const DEFAULT_PASSWORD = "RaTrading@2026";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in environment or .env");
    process.exit(1);
  }

  const email = (process.env.SEED_ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_PASSWORD;

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const passwordHash = await bcrypt.hash(password, 12);

  const count = await AdminSetting.countDocuments();
  if (count === 0) {
    await AdminSetting.create({
      siteAdminName: "Store Admin",
      siteAdminEmail: email,
      passwordHash,
      siteName: "Ra Trading",
    });
    console.log("Created admin settings.");
  } else {
    // Same login on every row — avoids "wrong" doc when duplicates existed from old seeds.
    await AdminSetting.updateMany(
      {},
      {
        $set: {
          siteAdminEmail: email,
          passwordHash,
          siteAdminName: "Store Admin",
        },
      }
    );
    console.log(`Synced admin email + password on ${count} AdminSetting document(s).`);
  }

  await mongoose.disconnect();

  console.log("\n========== Admin login (save these) ==========");
  console.log("URL:      /admin-login");
  console.log("Email:   ", email);
  console.log("Password:", password);
  console.log("==============================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
