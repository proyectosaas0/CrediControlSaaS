import { describe, expect, it } from "vitest";

const modules = [
  () => import("../../app/api/auth/me/route"),
  () => import("../../app/api/clientes/route"),
  () => import("../../app/api/clientes/[id]/route"),
];

describe("auth and clientes API contract files", () => {
  it.each(modules)("imports route module %#", async (loadModule) => {
    await expect(loadModule()).resolves.toBeTruthy();
  });
});
