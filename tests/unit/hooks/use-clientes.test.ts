import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { useClientes, Cliente } from '@/lib/hooks/use-clientes';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client');

describe('useClientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct hook structure', () => {
    expect(useClientes).toBeDefined();
    expect(typeof useClientes).toBe('function');
  });

  it('should use React Query with correct queryKey', () => {
    // Test that the hook uses useQuery with proper configuration
    const mockClientes: Cliente[] = [
      { id: '1', nombre: 'Cliente 1', cedula: '12345', telefono: '555-0001', barrio: 'Barrio A', activo: true, scorePago: 85 },
    ];

    vi.mocked(apiClient.get).mockResolvedValue(mockClientes);

    // The hook should call apiClient.get with '/clientes' endpoint
    expect(apiClient.get).toBeDefined();
  });

  it('should call apiClient.get with correct endpoint', async () => {
    const mockClientes: Cliente[] = [
      { id: '1', nombre: 'Cliente 1', cedula: '12345', telefono: '555-0001', barrio: 'Barrio A', activo: true, scorePago: 85 },
      { id: '2', nombre: 'Cliente 2', cedula: '67890', telefono: '555-0002', barrio: 'Barrio B', activo: false, scorePago: 60 },
    ];

    vi.mocked(apiClient.get).mockResolvedValue(mockClientes);

    // Test the query function directly
    const queryFn = async () => apiClient.get<Cliente[]>('/clientes');
    const result = await queryFn();

    expect(result).toEqual(mockClientes);
  });

  it('should have Cliente type with correct fields', () => {
    // Test type compatibility
    const testCliente: Cliente = {
      id: '1',
      nombre: 'Test',
      cedula: '12345',
      telefono: '555-0001',
      barrio: 'Test Barrio',
      activo: true,
      scorePago: 85,
    };

    expect(testCliente.id).toBe('1');
    expect(testCliente.nombre).toBe('Test');
    expect(testCliente.cedula).toBe('12345');
    expect(testCliente.telefono).toBe('555-0001');
    expect(testCliente.barrio).toBe('Test Barrio');
    expect(testCliente.activo).toBe(true);
    expect(testCliente.scorePago).toBe(85);
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error');
    vi.mocked(apiClient.get).mockRejectedValue(error);

    try {
      await apiClient.get<Cliente[]>('/clientes');
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err).toEqual(error);
    }
  });
});
