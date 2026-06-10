import { describe, it, expect } from "vitest";

describe("middleware module", () => {
  it("exports middleware function and config.matcher array", async () => {
    const mod = await import("../../middleware");
    expect(typeof mod.middleware).toBe("function");
    expect(Array.isArray(mod.config.matcher)).toBe(true);
    expect(mod.config.matcher.length).toBeGreaterThan(0);
  });
});
