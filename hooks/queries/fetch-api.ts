export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchApi<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  let json: { data?: T; error?: { code?: string; message?: string } };
  try {
    json = await res.json();
  } catch {
    throw new ApiError("PARSE_ERROR", `Error ${res.status}: respuesta inválida`, res.status);
  }
  if (!res.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? `Error ${res.status}`,
      res.status,
    );
  }
  return json.data as T;
}
