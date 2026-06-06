import { config } from "dotenv";
import { execSync } from "child_process";
import { beforeAll } from "vitest";

// Load .env and .env.local (Vitest only auto-loads .env)
config({ path: ".env.local", override: true });
config();

function runSeed() {
  try {
    execSync("npx tsx scripts/seed.ts", {
      stdio: "inherit",
      env: { ...process.env },
      cwd: process.cwd(),
    });
    console.log("✅ Test seed completed");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed before all tests
beforeAll(async () => {
  try {
    runSeed();
  } catch (error) {
    console.warn("Seed setup failed (tests may fail):", error);
  }
});
