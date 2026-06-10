import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookiesGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockCookiesGet })),
  headers: vi.fn(() => Promise.resolve({ get: vi.fn() })),
}));

const mockGetClaims = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getClaims: mockGetClaims }, from: mockFrom }),
  ),
}));

import { requireApiActor } from "@/lib/api/auth";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const ORG_ID = "22222222-2222-2222-2222-222222222222";

function mockProfile(org: { estado_suscripcion: string; trial_hasta: string | null } | null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { organization_id: ORG_ID, rol: "admin", activo: true, organizations: org },
      error: null,
    }),
  });
}

describe("requireApiActor — enforcement de suscripción", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue(undefined);
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: ADMIN_ID, rol: "admin", organization_id: ORG_ID } },
      error: null,
    });
  });

  it("permite admin con suscripción activa", async () => {
    mockProfile({ estado_suscripcion: "activo", trial_hasta: null });
    const { actor, response } = await requireApiActor();
    expect(response).toBeNull();
    expect(actor?.organizationId).toBe(ORG_ID);
  });

  it("bloquea con 402 a admin con tenant suspendido", async () => {
    mockProfile({ estado_suscripcion: "suspendido", trial_hasta: null });
    const { actor, response } = await requireApiActor();
    expect(actor).toBeNull();
    expect(response?.status).toBe(402);
  });

  it("bloquea con 402 a admin con trial expirado", async () => {
    mockProfile({ estado_suscripcion: "trial", trial_hasta: "2000-01-01" });
    const { response } = await requireApiActor();
    expect(response?.status).toBe(402);
  });

  it("NO bloquea a super_admin aunque la org esté vencida", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: ADMIN_ID, rol: "super_admin", organization_id: null } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { organization_id: null, rol: "super_admin", activo: true, organizations: null },
        error: null,
      }),
    });
    const { response } = await requireApiActor();
    expect(response).toBeNull();
  });
});
