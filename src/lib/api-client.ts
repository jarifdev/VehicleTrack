interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as
    | { data: T }
    | ApiErrorBody;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new Error(errorBody.error?.message ?? "Request failed");
  }

  return (body as { data: T }).data;
}
