import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getClaims = vi.fn();

  return { from, getClaims, maybeSingle };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getClaims: mocks.getClaims },
    from: mocks.from,
  })),
}));

describe("requireApiActor", () => {
  it("uses the active profile role when custom JWT role claim is missing", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    mocks.maybeSingle.mockResolvedValue({
      data: { organization_id: "org-1", rol: "admin", activo: true },
      error: null,
    });

    const { requireApiActor } = await import("@/lib/api/auth");
    const { actor, response } = await requireApiActor(["admin"]);

    expect(response).toBeNull();
    expect(actor).toEqual({
      userId: "user-1",
      role: "admin",
      organizationId: "org-1",
    });
  });
});
