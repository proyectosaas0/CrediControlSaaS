// ─── MOCK DATA: Super Admin ───
// TODO: Reemplazar por GET /api/super-admin/*

export type MockTenant = {
  id: string;
  nombreNegocio: string;
  ciudad: string | null;
  telefono: string | null;
  plan: "trial" | "basico" | "pro" | "enterprise";
  estadoSuscripcion: "trial" | "activo" | "suspendido" | "cancelado" | "expirado";
  trialHasta: string;
  createdAt: string;
  clientes: number;
  prestamos: number;
  cobradores: number;
  ultimoAcceso: string | null;
  logoUrl: string | null;
};

export type MockSuperAdminMetricas = {
  tenantsActivos: number;
  tenantsTrial: number;
  tenantsSuspendidos: number;
  tenantsTotales: number;
  prestamosTotales: number;
  pagosRegistrados: number;
  cobradoresActivos: number;
  ingresosEstimados: number;
  tasaConversion: number;
  crecimientoMensual: number;
};

export type MockCrecimientoMensual = {
  mes: string;
  tenants: number;
  prestamos: number;
};

export type MockPlan = {
  id: string;
  nombre: string;
  precioMensual: number;
  clientesMax: number;
  cobradoresMax: number;
  prestamosMax: number;
  soporteWhatsApp: boolean;
};

export type MockPagoSuscripcion = {
  id: string;
  tenantId: string;
  tenantNombre: string;
  plan: string;
  monto: number;
  estado: "exitoso" | "pendiente" | "fallido";
  fecha: string;
  metodo: "efectivo" | "transferencia" | "nequi";
};

export const MOCK_TENANTS: MockTenant[] = [
  {
    id: "org-1",
    nombreNegocio: "CrediPrestamos del Valle",
    ciudad: "Cali",
    telefono: "+573001234567",
    plan: "basico",
    estadoSuscripcion: "activo",
    trialHasta: "2026-01-15",
    createdAt: "2026-01-01",
    clientes: 12,
    prestamos: 8,
    cobradores: 2,
    ultimoAcceso: "2026-06-05T10:30:00Z",
    logoUrl: null,
  },
  {
    id: "org-2",
    nombreNegocio: "Rapicobro Medellin",
    ciudad: "Medellin",
    telefono: "+573007654321",
    plan: "pro",
    estadoSuscripcion: "activo",
    trialHasta: "2026-02-20",
    createdAt: "2026-02-01",
    clientes: 45,
    prestamos: 32,
    cobradores: 5,
    ultimoAcceso: "2026-06-05T09:15:00Z",
    logoUrl: null,
  },
  {
    id: "org-3",
    nombreNegocio: "PrestaYa Bogota",
    ciudad: "Bogota",
    telefono: "+573005555555",
    plan: "trial",
    estadoSuscripcion: "trial",
    trialHasta: "2026-06-20",
    createdAt: "2026-06-05",
    clientes: 3,
    prestamos: 1,
    cobradores: 0,
    ultimoAcceso: "2026-06-05T08:00:00Z",
    logoUrl: null,
  },
  {
    id: "org-4",
    nombreNegocio: "CrediFacil Barranquilla",
    ciudad: "Barranquilla",
    telefono: "+573001111000",
    plan: "trial",
    estadoSuscripcion: "trial",
    trialHasta: "2026-06-18",
    createdAt: "2026-06-03",
    clientes: 8,
    prestamos: 5,
    cobradores: 1,
    ultimoAcceso: "2026-06-04T16:30:00Z",
    logoUrl: null,
  },
  {
    id: "org-5",
    nombreNegocio: "Cobranza Express",
    ciudad: "Pereira",
    telefono: "+573002222000",
    plan: "trial",
    estadoSuscripcion: "suspendido",
    trialHasta: "2026-05-01",
    createdAt: "2026-04-01",
    clientes: 20,
    prestamos: 15,
    cobradores: 3,
    ultimoAcceso: "2026-05-10T12:00:00Z",
    logoUrl: null,
  },
  {
    id: "org-6",
    nombreNegocio: "Prestamos del Caribe",
    ciudad: "Cartagena",
    telefono: "+573003333000",
    plan: "basico",
    estadoSuscripcion: "activo",
    trialHasta: "2026-03-10",
    createdAt: "2026-02-15",
    clientes: 28,
    prestamos: 22,
    cobradores: 4,
    ultimoAcceso: "2026-06-05T07:45:00Z",
    logoUrl: null,
  },
  {
    id: "org-7",
    nombreNegocio: "Microcreditos Santander",
    ciudad: "Bucaramanga",
    telefono: "+573004444000",
    plan: "basico",
    estadoSuscripcion: "expirado",
    trialHasta: "2026-03-20",
    createdAt: "2026-02-20",
    clientes: 15,
    prestamos: 10,
    cobradores: 2,
    ultimoAcceso: null,
    logoUrl: null,
  },
  {
    id: "org-8",
    nombreNegocio: "Soluciones Financieras",
    ciudad: "Manizales",
    telefono: null,
    plan: "trial",
    estadoSuscripcion: "trial",
    trialHasta: "2026-06-25",
    createdAt: "2026-06-02",
    clientes: 1,
    prestamos: 0,
    cobradores: 0,
    ultimoAcceso: "2026-06-02T14:00:00Z",
    logoUrl: null,
  },
];

export const MOCK_SUPER_ADMIN_METRICAS: MockSuperAdminMetricas = {
  tenantsActivos: 3,
  tenantsTrial: 4,
  tenantsSuspendidos: 1,
  tenantsTotales: 8,
  prestamosTotales: 93,
  pagosRegistrados: 1240,
  cobradoresActivos: 17,
  ingresosEstimados: 4_800_000,
  tasaConversion: 37,
  crecimientoMensual: 15,
};

export const MOCK_CRECIMIENTO_MENSUAL: MockCrecimientoMensual[] = [
  { mes: "Ene", tenants: 1, prestamos: 8 },
  { mes: "Feb", tenants: 3, prestamos: 32 },
  { mes: "Mar", tenants: 4, prestamos: 48 },
  { mes: "Abr", tenants: 5, prestamos: 65 },
  { mes: "May", tenants: 6, prestamos: 78 },
  { mes: "Jun", tenants: 8, prestamos: 93 },
];

export const MOCK_PLANES: MockPlan[] = [
  { id: "trial", nombre: "Gratuito (15 dias)", precioMensual: 0, clientesMax: 50, cobradoresMax: 2, prestamosMax: 20, soporteWhatsApp: false },
  { id: "basico", nombre: "Basico", precioMensual: 49_900, clientesMax: 200, cobradoresMax: 5, prestamosMax: 100, soporteWhatsApp: true },
  { id: "pro", nombre: "Profesional", precioMensual: 99_900, clientesMax: 1000, cobradoresMax: 15, prestamosMax: 500, soporteWhatsApp: true },
  { id: "enterprise", nombre: "Empresarial", precioMensual: 199_900, clientesMax: -1, cobradoresMax: -1, prestamosMax: -1, soporteWhatsApp: true },
];

export const MOCK_PAGOS_SUSCRIPCION: MockPagoSuscripcion[] = [
  { id: "sub-1", tenantId: "org-1", tenantNombre: "CrediPrestamos del Valle", plan: "Basico", monto: 49_900, estado: "exitoso", fecha: "2026-06-01", metodo: "transferencia" },
  { id: "sub-2", tenantId: "org-2", tenantNombre: "Rapicobro Medellin", plan: "Profesional", monto: 99_900, estado: "exitoso", fecha: "2026-06-01", metodo: "nequi" },
  { id: "sub-3", tenantId: "org-1", tenantNombre: "CrediPrestamos del Valle", plan: "Basico", monto: 49_900, estado: "exitoso", fecha: "2026-05-01", metodo: "transferencia" },
  { id: "sub-4", tenantId: "org-2", tenantNombre: "Rapicobro Medellin", plan: "Profesional", monto: 99_900, estado: "exitoso", fecha: "2026-05-01", metodo: "efectivo" },
  { id: "sub-5", tenantId: "org-6", tenantNombre: "Prestamos del Caribe", plan: "Basico", monto: 49_900, estado: "pendiente", fecha: "2026-06-05", metodo: "transferencia" },
  { id: "sub-6", tenantId: "org-6", tenantNombre: "Prestamos del Caribe", plan: "Basico", monto: 49_900, estado: "exitoso", fecha: "2026-05-01", metodo: "transferencia" },
];

export type MockActividadReciente = {
  id: string;
  tenantId: string;
  tenantNombre: string;
  tipo: "registro" | "prestamo" | "pago" | "suspension" | "activacion";
  descripcion: string;
  fecha: string;
};

export const MOCK_ACTIVIDAD_RECIENTE: MockActividadReciente[] = [
  { id: "act-1", tenantId: "org-3", tenantNombre: "PrestaYa Bogota", tipo: "registro", descripcion: "Nuevo tenant registrado", fecha: "2026-06-05T08:00:00Z" },
  { id: "act-2", tenantId: "org-2", tenantNombre: "Rapicobro Medellin", tipo: "pago", descripcion: "Pago de 2 cobradores registrados hoy", fecha: "2026-06-05T09:30:00Z" },
  { id: "act-3", tenantId: "org-1", tenantNombre: "CrediPrestamos del Valle", tipo: "prestamo", descripcion: "Nuevo prestamo de $2.500.000", fecha: "2026-06-05T10:15:00Z" },
  { id: "act-4", tenantId: "org-5", tenantNombre: "Cobranza Express", tipo: "suspension", descripcion: "Tenant suspendido por periodo expirado", fecha: "2026-06-04T18:00:00Z" },
  { id: "act-5", tenantId: "org-4", tenantNombre: "CrediFacil Barranquilla", tipo: "registro", descripcion: "Nuevo tenant registrado", fecha: "2026-06-03T14:30:00Z" },
  { id: "act-6", tenantId: "org-2", tenantNombre: "Rapicobro Medellin", tipo: "prestamo", descripcion: "5 nuevos prestamos creados hoy", fecha: "2026-06-05T11:00:00Z" },
  { id: "act-7", tenantId: "org-1", tenantNombre: "CrediPrestamos del Valle", tipo: "pago", descripcion: "12 pagos registrados hoy", fecha: "2026-06-05T11:30:00Z" },
];
