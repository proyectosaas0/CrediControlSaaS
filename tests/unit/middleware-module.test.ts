import { describe, it, expect } from "vitest";

describe("middleware module", () => {
  it("exports proxy function and config.matcher array", async () => {
    const mod = await import("../../proxy");
    expect(typeof mod.proxy).toBe("function");
    expect(Array.isArray(mod.config.matcher)).toBe(true);
    expect(mod.config.matcher.length).toBeGreaterThan(0);
  });
});
