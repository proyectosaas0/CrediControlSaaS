import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers before importing the module under test
const mockCookiesGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockCookiesGet })),
  headers: vi.fn(() => Promise.resolve({ get: vi.fn() })),
}));

// Mock supabase server client
const mockGetClaims = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getClaims: mockGetClaims },
      from: mockFrom,
    })
  ),
}));

import { requireApiActor } from "@/lib/api/auth";

describe("requireApiActor — super_admin cookie org injection", () => {
  const SUPER_ADMIN_ID = "d8b357ca-2d3e-47e6-893b-20269dbbdcdd";
  const ORG_ID = "0d549dc6-eff5-435c-b2e4-2ed1ac1823c0";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: SUPER_ADMIN_ID, rol: "super_admin" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { organization_id: null, rol: "super_admin", activo: true },
        error: null,
      }),
    });
  });

  it("uses cookie org when super_admin has no JWT org", async () => {
    mockCookiesGet.mockReturnValue({ value: ORG_ID });

    const { actor, response } = await requireApiActor();

    expect(response).toBeNull();
    expect(actor?.organizationId).toBe(ORG_ID);
    expect(actor?.role).toBe("super_admin");
  });

  it("leaves organizationId null when cookie is absent", async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const { actor } = await requireApiActor();

    expect(actor?.organizationId).toBeNull();
  });

  it("ignores cookie when super_admin already has JWT org", async () => {
    // Override getClaims to include an organization_id in the JWT
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: SUPER_ADMIN_ID, rol: "super_admin", organization_id: ORG_ID } },
      error: null,
    });
    // Also update profile mock to reflect the org
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { organization_id: ORG_ID, rol: "super_admin", activo: true },
        error: null,
      }),
    });
    // Cookie has a different org — should be ignored
    const OTHER_ORG = "ba134dd3-c9fe-4123-8cb3-fcfea358071e";
    mockCookiesGet.mockReturnValue({ value: OTHER_ORG });

    const { actor } = await requireApiActor();

    expect(actor?.organizationId).toBe(ORG_ID);
  });

  it("does not inject cookie org for non-super_admin role", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: SUPER_ADMIN_ID, rol: "admin" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          organization_id: null,
          rol: "admin",
          activo: true,
          organizations: { estado_suscripcion: "activo", trial_hasta: null },
        },
        error: null,
      }),
    });
    mockCookiesGet.mockReturnValue({ value: ORG_ID });

    const { actor } = await requireApiActor();

    expect(actor?.organizationId).toBeNull();
  });
});
