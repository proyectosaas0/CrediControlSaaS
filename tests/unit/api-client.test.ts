import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include Authorization header with token', async () => {
    const mockToken = 'test-token-123';
    const mockSession = {
      user: { id: 'user-1' },
      access_token: mockToken,
    };

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        })
      },
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test' }] }),
    });

    const result = await apiClient.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
    expect(result).toEqual([{ id: '1', name: 'Test' }]);
  });

  it('should throw error when response has error field', async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        })
      },
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ error: { message: 'API Error' } }),
    });

    await expect(apiClient.get('/test')).rejects.toThrow('API Error');
  });

  it('should throw error when HTTP response is not ok', async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        })
      },
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: { message: 'Server Error' } }),
    });

    await expect(apiClient.get('/test')).rejects.toThrow();
  });

  it('should return data when response is successful', async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        })
      },
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test' } }),
    });

    const result = await apiClient.get('/test');

    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('should make POST requests with body', async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        })
      },
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: '2', name: 'Created' } }),
    });

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
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        })
      },
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Updated' } }),
    });

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
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        })
      },
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { deleted: true } }),
    });

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
