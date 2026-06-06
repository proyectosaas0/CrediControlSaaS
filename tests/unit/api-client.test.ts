import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/lib/api/client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should send cookies with request', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test' }] }),
    } as unknown as Response);

    const result = await apiClient.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        credentials: 'include',
      })
    );
    expect(result).toEqual([{ id: '1', name: 'Test' }]);
  });

  it('should throw error when response has error field', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ error: { message: 'API Error' } }),
    } as unknown as Response);

    await expect(apiClient.get('/test')).rejects.toThrow('API Error');
  });

  it('should throw error when HTTP response is not ok', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ error: { message: 'Server Error' } }),
    } as unknown as Response);

    await expect(apiClient.get('/test')).rejects.toThrow('HTTP 500');
  });

  it('should throw error when HTTP response fails with non-JSON response', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockRejectedValue(new Error('Not JSON')),
    } as unknown as Response);

    await expect(apiClient.get('/test')).rejects.toThrow('HTTP 500');
  });

  it('should throw error when response is missing data field', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    await expect(apiClient.get('/test')).rejects.toThrow('missing data field');
  });

  it('should return data when response is successful', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test' } }),
    } as unknown as Response);

    const result = await apiClient.get('/test');

    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('should make POST requests with body', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: '2', name: 'Created' } }),
    } as unknown as Response);

    const body = { name: 'Created' };
    const result = await apiClient.post('/test', body);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
    expect(result).toEqual({ id: '2', name: 'Created' });
  });

  it('should make PUT requests with body', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Updated' } }),
    } as unknown as Response);

    const body = { name: 'Updated' };
    const result = await apiClient.put('/test/1', body);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(body),
      })
    );
    expect(result).toEqual({ id: '1', name: 'Updated' });
  });

  it('should make DELETE requests', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { deleted: true } }),
    } as unknown as Response);

    const result = await apiClient.delete('/test/1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
    expect(result).toEqual({ deleted: true });
  });
});
