// ─── MOCK DATA: Configuración Tenant ───
// TODO: Reemplazar por GET/PATCH tenant_settings

export type MockTenantSettings = {
  nombreNegocio: string;
  logoUrl: string;
  ciudad: string;
  telefono: string;
  moraTipo: "porcentaje" | "monto_fijo";
  moraValor: number;
  diasGracia: number;
  cobrarSabados: boolean;
  cobrarDomingos: boolean;
  tasaInteresDefault: number;
  whatsappTemplate: string;
  geolocalizacionRequerida: boolean;
  moneda: "COP" | "USD";
  horarioInicio: string;
  horarioFin: string;
  colorPrimario: string;
};

export const MOCK_TENANT_SETTINGS: MockTenantSettings = {
  nombreNegocio: "CrediPrestamos del Valle",
  logoUrl: "",
  ciudad: "Cali",
  telefono: "+573001234567",
  moraTipo: "porcentaje",
  moraValor: 5,
  diasGracia: 3,
  cobrarSabados: true,
  cobrarDomingos: false,
  tasaInteresDefault: 10,
  whatsappTemplate: "Hola {cliente}, tu pago de {monto} por el prestamo {prestamo_id} ha sido registrado. Gracias por tu puntualidad. - {negocio}",
  geolocalizacionRequerida: false,
  moneda: "COP",
  horarioInicio: "07:00",
  horarioFin: "18:00",
  colorPrimario: "#1d4ed8",
};
