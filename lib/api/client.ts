const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type ApiResponse<T> = {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let result: ApiResponse<T>;
  try {
    result = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    throw new Error('Failed to parse response as JSON');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${result.error?.message || response.statusText}`);
  }

  if (result.error) {
    throw new Error(result.error.message || 'API request failed');
  }

  if (result.data === undefined) {
    throw new Error('API response missing data field');
  }

  return result.data;
}

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

export const apiClient = {
  get: <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T = unknown>(endpoint: string, body: JsonBody) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = unknown>(endpoint: string, body: JsonBody) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
