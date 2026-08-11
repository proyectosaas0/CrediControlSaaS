import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrestamos, type Prestamo } from '@/lib/hooks/use-prestamos';
import { apiClient } from '@/lib/api/client';
import { ReactNode } from 'react';

vi.mock('@/lib/api/client');

/** Mock API returns snake_case — the hook's select transforms to camelCase */
const snakePrestamos = [
  {
    id: '1', cliente_id: 'c1', cobrador_id: 'cb1', capital: 500000,
    modelo_interes: 'cuota_fija', tasa_mensual: 10, plazo_dias: 30,
    cuota_diaria: 20000, total_pagar: 600000,
    fecha_inicio: '2024-01-01', fecha_fin: '2024-01-30',
    estado: 'activo', cuotas_pagadas: 10, cuotas_totales: 30,
    cliente_nombre: 'Juan Perez', cobrador_nombre: 'Carlos',
    prestamo_saldos: [{ saldo_pendiente: 400000 }],
  },
  {
    id: '2', cliente_id: 'c2', cobrador_id: 'cb1', capital: 300000,
    modelo_interes: 'cuota_fija', tasa_mensual: 10, plazo_dias: 30,
    cuota_diaria: 15000, total_pagar: 450000,
    fecha_inicio: '2024-02-01', fecha_fin: '2024-02-28',
    estado: 'saldado', cuotas_pagadas: 30, cuotas_totales: 30,
    cliente_nombre: 'Maria Garcia', cobrador_nombre: 'Carlos',
    prestamo_saldos: [{ saldo_pendiente: 0 }],
  },
];

/** Expected output after transform */
const expectedPrestamos: Prestamo[] = [
  {
    id: '1', clienteId: 'c1', clienteNombre: 'Juan Perez', capital: 500000,
    modeloInteres: 'cuota_fija', tasaMensual: 10, plazoDias: 30,
    cuotaDiaria: 20000, totalPagar: 600000,
    fechaInicio: '2024-01-01', fechaFin: '2024-01-30',
    excluirSabados: false, excluirDomingos: false,
    estado: 'activo', cuotasPagadas: 10, cuotasTotales: 30,
    saldoPendiente: 400000, cobradorId: 'cb1', cobradorNombre: 'Carlos',
  },
  {
    id: '2', clienteId: 'c2', clienteNombre: 'Maria Garcia', capital: 300000,
    modeloInteres: 'cuota_fija', tasaMensual: 10, plazoDias: 30,
    cuotaDiaria: 15000, totalPagar: 450000,
    fechaInicio: '2024-02-01', fechaFin: '2024-02-28',
    excluirSabados: false, excluirDomingos: false,
    estado: 'saldado', cuotasPagadas: 30, cuotasTotales: 30,
    saldoPendiente: 0, cobradorId: 'cb1', cobradorNombre: 'Carlos',
  },
];

describe('usePrestamos', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch prestamos successfully', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(snakePrestamos);

    const { result } = renderHook(() => usePrestamos(), { wrapper });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual(expectedPrestamos);
    expect(result.current.isSuccess).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith('/prestamos');
  });

  it('should verify apiClient.get is called with correct endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(snakePrestamos);

    const { result } = renderHook(() => usePrestamos(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith('/prestamos');
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should use correct query key for caching', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(snakePrestamos);

    const { result: result1 } = renderHook(() => usePrestamos(), { wrapper });

    await waitFor(() => expect(result1.current.isPending).toBe(false));

    const { result: result2 } = renderHook(() => usePrestamos(), { wrapper });

    expect(result2.current.data).toEqual(expectedPrestamos);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should have correct query configuration', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    const { result } = renderHook(() => usePrestamos(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current).toBeDefined();
  });
});
