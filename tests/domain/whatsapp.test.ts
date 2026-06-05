import { describe, expect, it } from "vitest";
import { buildReceiptMessage } from "@/lib/domain/whatsapp";

describe("whatsapp receipt", () => {
  it("builds receipt text", () => {
    const message = buildReceiptMessage({
      negocio: "Prestamos La Esperanza",
      cliente: "Cliente A",
      monto: 60000,
      medioPago: "efectivo",
      cuota: "1 de 10",
      saldo: 540000,
      cobrador: "Cobrador A1",
      fecha: "2026-06-05 09:30",
    });

    expect(message).toContain("Prestamos La Esperanza");
    expect(message).toContain("$60.000");
    expect(message).toContain("Cuota 1 de 10");
  });
});
