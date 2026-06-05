import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    env: { ...process.env },
    setupFiles: ["dotenv/config"],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
