// ─── MOCK DATA: Mora ───
// TODO: Reemplazar por GET /api/mora cuando el backend esté listo.

export type MockMora = {
  id: string;
  prestamoId: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  cobradorNombre: string;
  diasMora: number;
  montoMora: number;
  montoPagadoMora: number;
  estado: "activa" | "pagada" | "condonada";
  fechaInicioMora: string;
  cuotaDiaria: number;
  capital: number;
};

export const MOCK_MORA: MockMora[] = [
  {
    id: "m-1",
    prestamoId: "pr-5",
    clienteId: "c-5",
    clienteNombre: "Luisa Fernandez",
    clienteTelefono: "+573005555555",
    cobradorNombre: "Ana Gomez",
    diasMora: 27,
    montoMora: 264_000,
    montoPagadoMora: 0,
    estado: "activa",
    fechaInicioMora: "2026-05-10",
    cuotaDiaria: 73_333,
    capital: 2_000_000,
  },
  {
    id: "m-2",
    prestamoId: "pr-9",
    clienteId: "c-9",
    clienteNombre: "Carolina Morales",
    clienteTelefono: "+573009999999",
    cobradorNombre: "Ana Gomez",
    diasMora: 36,
    montoMora: 280_000,
    montoPagadoMora: 0,
    estado: "activa",
    fechaInicioMora: "2026-05-01",
    cuotaDiaria: 70_000,
    capital: 2_500_000,
  },
  {
    id: "m-3",
    prestamoId: "pr-4",
    clienteId: "c-4",
    clienteNombre: "Jose Martinez",
    clienteTelefono: "+573004444444",
    cobradorNombre: "Ana Gomez",
    diasMora: 10,
    montoMora: 150_000,
    montoPagadoMora: 0,
    estado: "activa",
    fechaInicioMora: "2026-05-27",
    cuotaDiaria: 50_000,
    capital: 1_200_000,
  },
  {
    id: "m-4",
    prestamoId: "pr-6",
    clienteId: "c-6",
    clienteNombre: "Pedro Sanchez",
    clienteTelefono: "+573006666666",
    cobradorNombre: "Juan Perez",
    diasMora: 5,
    montoMora: 25_000,
    montoPagadoMora: 0,
    estado: "activa",
    fechaInicioMora: "2026-06-01",
    cuotaDiaria: 55_000,
    capital: 1_500_000,
  },
  {
    id: "m-5",
    prestamoId: "pr-2",
    clienteId: "c-2",
    clienteNombre: "Carlos Perez",
    clienteTelefono: "+573005666666",
    cobradorNombre: "Juan Perez",
    diasMora: 18,
    montoMora: 120_000,
    montoPagadoMora: 120_000,
    estado: "pagada",
    fechaInicioMora: "2026-04-25",
    cuotaDiaria: 45_000,
    capital: 800_000,
  },
  {
    id: "m-6",
    prestamoId: "pr-1",
    clienteId: "c-1",
    clienteNombre: "Maria Garcia",
    clienteTelefono: "+573001111111",
    cobradorNombre: "Juan Perez",
    diasMora: 12,
    montoMora: 50_000,
    montoPagadoMora: 0,
    estado: "condonada",
    fechaInicioMora: "2026-04-15",
    cuotaDiaria: 55_000,
    capital: 1_500_000,
  },
];
