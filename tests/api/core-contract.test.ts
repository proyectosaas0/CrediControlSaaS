import { describe, expect, it } from "vitest";

const modules = [
  () => import("../../app/api/prestamos/route"),
  () => import("../../app/api/prestamos/[id]/route"),
  () => import("../../app/api/prestamos/[id]/cronograma/route"),
  () => import("../../app/api/ruta/hoy/route"),
  () => import("../../app/api/pagos/route"),
  () => import("../../app/api/pagos/[id]/comprobante/route"),
];

describe("core API contract files", () => {
  it.each(modules)("imports route module %#", async (loadModule) => {
    await expect(loadModule()).resolves.toBeTruthy();
  });
});
