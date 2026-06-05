import "dotenv/config";
import { spawn } from "child_process";
import { beforeAll } from "vitest";

async function runSeed() {
  return new Promise<void>((resolve, reject) => {
    const seed = spawn("tsx", ["scripts/seed.ts"], {
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    let output = "";
    seed.stdout?.on("data", (data) => {
      output += data.toString();
    });

    seed.stderr?.on("data", (data) => {
      console.error("Seed error:", data.toString());
    });

    seed.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Test seed completed");
        resolve();
      } else {
        console.error("❌ Seed failed:", output);
        reject(new Error(`Seed failed with code ${code}`));
      }
    });
  });
}

// Run seed before all tests
beforeAll(async () => {
  try {
    await runSeed();
  } catch (error) {
    console.warn("Seed setup failed (tests may fail):", error);
  }
});
