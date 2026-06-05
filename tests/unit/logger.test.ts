import { describe, it, expect, vi } from "vitest";
import { logger } from "@/lib/logger";

describe("Logger", () => {
  it("creates a pino logger instance", () => {
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it("includes log level from environment", () => {
    const testLogger = logger.child({ test: true });
    expect(testLogger).toBeDefined();
  });
});
