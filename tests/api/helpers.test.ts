import { describe, expect, it } from "vitest";
import { apiError, apiOk } from "@/lib/api/errors";

describe("REST response helpers", () => {
  it("builds success payloads", async () => {
    const response = apiOk({ id: "1" }, { page: 1 });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { id: "1" }, meta: { page: 1 } });
  });

  it("builds error payloads", async () => {
    const response = apiError("FORBIDDEN", "No autorizado", 403, { role: "cobrador" });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "FORBIDDEN", message: "No autorizado", details: { role: "cobrador" } },
    });
  });
});
