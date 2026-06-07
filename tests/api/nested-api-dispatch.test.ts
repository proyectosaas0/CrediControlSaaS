import { describe, expect, it } from "vitest";
import { GET, POST } from "../../app/api/[...path]/route";

describe("nested API dispatch", () => {
  it("dispatches reportes resumen through catch-all", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/reportes/resumen?desde=2026-06-07&hasta=2026-06-07"),
      { params: Promise.resolve({ path: ["reportes", "resumen"] }) },
    );

    expect(response.status).toBe(401);
  });

  it("dispatches ruta hoy through catch-all", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/ruta/hoy?fecha=2026-06-07"),
      { params: Promise.resolve({ path: ["ruta", "hoy"] }) },
    );

    expect(response.status).toBe(401);
  });

  it("dispatches ruta visitas through catch-all", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/ruta/visitas", { method: "POST" }),
      { params: Promise.resolve({ path: ["ruta", "visitas"] }) },
    );

    expect(response.status).toBe(401);
  });
});
