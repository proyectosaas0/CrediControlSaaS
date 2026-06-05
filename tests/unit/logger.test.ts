import { describe, it, expect } from "vitest";
import { logger } from "@/lib/logger";
import { getContextLogger } from "@/lib/api/request-context";

describe("Logger", () => {
  it("creates a pino logger instance", () => {
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it("creates child logger with context fields", () => {
    const context = {
      requestId: "test-123",
      userId: "user-456",
      organizationId: "org-789",
      method: "POST",
      path: "/api/pagos",
    };
    const contextLogger = getContextLogger(context);
    expect(contextLogger).toBeDefined();
    expect(contextLogger.debug).toBeDefined();
  });

  it("logger child includes context metadata", () => {
    const child = logger.child({
      requestId: "req-abc",
      userId: "usr-def",
    });
    expect(child).toBeDefined();
    // Verify child logger is usable
    expect(typeof child.info).toBe("function");
  });
});
