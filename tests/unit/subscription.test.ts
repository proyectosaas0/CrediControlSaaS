import { describe, it, expect } from "vitest";
import { isSubscriptionActive } from "@/lib/domain/subscription";

describe("isSubscriptionActive", () => {
  const today = "2026-06-09";

  it("activo siempre está activo", () => {
    expect(isSubscriptionActive({ estado: "activo", trialHasta: null, today })).toBe(true);
  });

  it("suspendido nunca está activo", () => {
    expect(isSubscriptionActive({ estado: "suspendido", trialHasta: "2099-01-01", today })).toBe(false);
  });

  it("vencido nunca está activo", () => {
    expect(isSubscriptionActive({ estado: "vencido", trialHasta: "2099-01-01", today })).toBe(false);
  });

  it("trial vigente (trial_hasta >= hoy) está activo", () => {
    expect(isSubscriptionActive({ estado: "trial", trialHasta: "2026-06-09", today })).toBe(true);
    expect(isSubscriptionActive({ estado: "trial", trialHasta: "2026-06-30", today })).toBe(true);
  });

  it("trial expirado (trial_hasta < hoy) NO está activo", () => {
    expect(isSubscriptionActive({ estado: "trial", trialHasta: "2026-06-08", today })).toBe(false);
  });

  it("trial sin fecha no está activo", () => {
    expect(isSubscriptionActive({ estado: "trial", trialHasta: null, today })).toBe(false);
  });

  it("estado desconocido no está activo", () => {
    expect(isSubscriptionActive({ estado: "loquesea", trialHasta: null, today })).toBe(false);
  });
});
