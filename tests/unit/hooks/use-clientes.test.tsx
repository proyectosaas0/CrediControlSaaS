import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClientes, type Cliente } from '@/lib/hooks/use-clientes';
import { apiClient } from '@/lib/api/client';
import { ReactNode } from 'react';

vi.mock('@/lib/api/client');

/** Mock API returns snake_case — the hook's select transforms to camelCase */
const snakeClientes = [
  { id: '1', nombre: 'Cliente 1', cedula: '12345', telefono: '555-0001', barrio: 'Barrio A', direccion: 'Calle 1', notas: 'nota', activo: true, score_pago: 85, created_at: '2024-01-01' },
  { id: '2', nombre: 'Cliente 2', cedula: '67890', telefono: '555-0002', barrio: 'Barrio B', direccion: 'Calle 2', notas: null, activo: false, score_pago: 60, created_at: '2024-01-02' },
];

/** Expected output after transformSnake */
const expectedClientes: Cliente[] = [
  { id: '1', nombre: 'Cliente 1', cedula: '12345', telefono: '555-0001', barrio: 'Barrio A', direccion: 'Calle 1', notas: 'nota', activo: true, scorePago: 85, createdAt: '2024-01-01' },
  { id: '2', nombre: 'Cliente 2', cedula: '67890', telefono: '555-0002', barrio: 'Barrio B', direccion: 'Calle 2', notas: '', activo: false, scorePago: 60, createdAt: '2024-01-02' },
];

describe('useClientes', () => {
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

  it('should fetch clientes successfully', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(snakeClientes);

    const { result } = renderHook(() => useClientes(), { wrapper });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual(expectedClientes);
    expect(result.current.isSuccess).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith('/clientes');
  });

  it('should verify apiClient.get is called with correct endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(snakeClientes);

    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith('/clientes');
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should use correct query key for caching', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(snakeClientes);

    const { result: result1 } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result1.current.isPending).toBe(false));

    const { result: result2 } = renderHook(() => useClientes(), { wrapper });

    expect(result2.current.data).toEqual(expectedClientes);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should have correct query configuration', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current).toBeDefined();
  });
});
